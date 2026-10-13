import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import boxen from 'boxen';

// Store security lock inside user ~/.buggraph folder or current directory fallback
function getLockFilePath() {
  try {
    const homeDir = os.homedir();
    return path.join(homeDir, '.buggraph', 'security_lock.json');
  } catch {
    return path.join(process.cwd(), '.security_lock.json');
  }
}

// 24 Hours in Milliseconds
export const SUSPENSION_DURATION_MS = 24 * 60 * 60 * 1000;

// Emergency Developer Reset Key for QA / Teammates during testing
export const DEV_OVERRIDE_KEY = 'BUGGRAPH_DEV_OVERRIDE_2026';

/**
 * Signatures that indicate an attempt to tamper with security measures,
 * disable protections, perform system escapes, or execute destructive actions.
 */
export const TAMPER_SIGNATURES = [
  {
    category: 'SECURITY_MEASURE_BYPASS',
    pattern: /\b(bypass[-_ ]?security|disable[-_ ]?protection|override[-_ ]?sanitizer|strip[-_ ]?guards|tamper[-_ ]?rules|unmask[-_ ]?all)\b/i,
    description: 'Attempted to bypass or tamper with BugGraph security / sanitization measures'
  },
  {
    category: 'PRIVILEGE_ESCALATION',
    pattern: /\b(sudo|elevate[-_ ]?privilege|root[-_ ]?access|admin[-_ ]?override|force[-_ ]?unlock|hack[-_ ]?system)\b/i,
    description: 'Attempted unauthorized privilege escalation or root boundary access'
  },
  {
    category: 'CREDENTIAL_EXFILTRATION',
    pattern: /\b(dump[-_ ]?secrets|steal[-_ ]?keys|extract[-_ ]?tokens|read[-_ ]?env|leak[-_ ]?credentials|cat\s+\.env)\b/i,
    description: 'Attempted exfiltration of system environment secrets or tokens'
  },
  {
    category: 'SYSTEM_COMMAND_INJECTION',
    pattern: /\b(rm\s+-(?:rf|r|f)|format\s+[a-z]:|del\s+\/[fq]|mkfs|dd\s+if=|cat\s+\/etc\/(?:passwd|shadow))\b/i,
    description: 'Attempted destructive system command execution or shell injection'
  },
  {
    category: 'SHELL_SPAWN_ATTEMPT',
    pattern: /\b(powershell\s+-enc|cmd\.exe\s+\/c|bash\s+-i|nc\s+-e|\/bin\/(?:ba)?sh|sh\s+-c)\b/i,
    description: 'Attempted spawning unauthorized interactive shell or reverse shell'
  },
  {
    category: 'DATABASE_DESTRUCTION',
    pattern: /\b(drop\s+(?:database|schema|table)\s+|truncate\s+table\s+|delete\s+from\s+[a-z_]+\s+where\s+1\s*=\s*1)\b/i,
    description: 'Attempted destructive database manipulation or table dropping'
  },
  {
    category: 'PATH_TRAVERSAL_PROBE',
    pattern: /(\.\.[\/\\]){2,}|(\/etc\/[a-z_]+)|(C:\\(?:Windows|Boot|System32))/i,
    description: 'Attempted directory traversal beyond permitted workstation sandbox'
  },
  {
    category: 'CODE_EVAL_INJECTION',
    pattern: /\b(eval\s*\(|Function\s*\(|require\s*\(\s*['"]child_process['"]\)|child_process\.exec)\b/i,
    description: 'Attempted arbitrary code execution or runtime process injection'
  },
  {
    category: 'SAFETY_PROMPT_JAILBREAK',
    pattern: /\b(ignore\s+(?:all\s+)?previous\s+instructions\s+and\s+(?:reveal|bypass|disable|override))\b/i,
    description: 'Attempted prompt injection to circumvent ethical or safety boundaries'
  }
];

/**
 * Format remaining time nicely (e.g. 23h 59m 12s)
 */
export function formatTimeRemaining(ms) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Checks an input string against security tamper signatures.
 */
export function checkTamperViolation(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isViolation: false };
  }

  const normalized = rawInput.trim();

  for (const sig of TAMPER_SIGNATURES) {
    if (sig.pattern.test(normalized)) {
      return {
        isViolation: true,
        category: sig.category,
        description: sig.description,
        pattern: sig.pattern.toString(),
        sample: normalized.length > 80 ? normalized.substring(0, 80) + '...' : normalized
      };
    }
  }

  return { isViolation: false };
}

/**
 * Reads the current security lockfile from disk.
 */
export async function getLockData() {
  const lockPath = getLockFilePath();
  try {
    const raw = await fs.readFile(lockPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { locks: {} };
  }
}

/**
 * Writes the security lockfile to disk.
 */
export async function saveLockData(data) {
  const lockPath = getLockFilePath();
  try {
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    await fs.writeFile(lockPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal fallback
  }
}

/**
 * Checks whether the client is currently suspended under the 24-hour lockout.
 */
export async function isClientSuspended(clientId = 'default') {
  const data = await getLockData();
  const lock = data.locks[clientId] || data.locks['global'];

  if (!lock) {
    return { isSuspended: false, remainingMs: 0 };
  }

  const now = Date.now();
  if (now < lock.unlockAt) {
    const remainingMs = lock.unlockAt - now;
    return {
      isSuspended: true,
      remainingMs,
      lock
    };
  }

  // Lock has expired; clean it up
  delete data.locks[clientId];
  if (data.locks['global']) delete data.locks['global'];
  await saveLockData(data);

  return { isSuspended: false, remainingMs: 0 };
}

/**
 * Applies a 24-hour suspension lock for a client.
 */
export async function applySuspension({ clientId = 'default', reason, trigger, category } = {}) {
  const data = await getLockData();
  const now = Date.now();
  const unlockAt = now + SUSPENSION_DURATION_MS;

  const incidentId = 'SEC-' + Math.floor(100000 + Math.random() * 900000);

  const lock = {
    incidentId,
    active: true,
    lockedAt: now,
    unlockAt,
    durationMs: SUSPENSION_DURATION_MS,
    reason: reason || 'Violation of BugGraph security measure policy.',
    category: category || 'SECURITY_POLICY_VIOLATION',
    trigger: trigger ? trigger.substring(0, 100) : 'Tamper attempt detected',
    clientId
  };

  data.locks[clientId] = lock;
  data.locks['global'] = lock; // also apply globally across CLI
  await saveLockData(data);

  return lock;
}

/**
 * Emergency developer reset to clear suspension (requires key).
 */
export async function resetSuspension(providedKey) {
  if (providedKey !== DEV_OVERRIDE_KEY) {
    return { success: false, error: 'Invalid developer override key' };
  }

  const data = { locks: {} };
  await saveLockData(data);

  return { success: true, message: 'All security suspensions cleared successfully' };
}

/**
 * Renders the high-impact Security Lockout Banner in the console.
 */
export function displayLockoutWarning(lock, remainingMs) {
  const warningText = [
    chalk.bold.hex('#ff3366')('🚨 CRITICAL SECURITY INCIDENT DETECTED // ACCESS SUSPENDED 🚨\n'),
    chalk.bold.yellow('POLICY VIOLATION:') + ' Attempted circumvention of system security boundary.',
    chalk.bold('CATEGORY        :') + ` ${chalk.red(lock.category || 'SECURITY_POLICY_VIOLATION')}`,
    chalk.bold('INCIDENT ID     :') + ` ${chalk.cyan(lock.incidentId || 'SEC-000000')}`,
    chalk.bold('TRIGGER SAMPLE  :') + ` ${chalk.gray(lock.trigger || 'N/A')}`,
    chalk.bold('REASON          :') + ` ${lock.reason || 'Tampering with security guardrails.'}\n`,
    chalk.bold.hex('#ff3366')(`STATUS          : TERMINAL ACTIVITY SUSPENDED FOR 24 HOURS`),
    chalk.bold.yellow(`LOCKOUT REMAINING: `) + chalk.bold.white(formatTimeRemaining(remainingMs)),
    chalk.bold('UNFREEZE TIME   :') + ` ${new Date(lock.unlockAt).toLocaleString()}\n`,
    chalk.gray('────────────────────────────────────────────────────────────────────────'),
    chalk.gray('In accordance with BugGraph Workstation Security Protocols, all diagnostic,'),
    chalk.gray('patching, and model inference commands are locked for 24 hours.'),
    chalk.gray('Developers may unlock in emergencies using: ') + chalk.yellow('buggraph reset-security --key <KEY>')
  ].join('\n');

  console.log(boxen(warningText, {
    padding: 1,
    margin: 1,
    borderColor: 'red',
    borderStyle: 'double'
  }));
}
