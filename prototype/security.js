import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCK_FILE_PATH = path.join(__dirname, '.security_lock.json');

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
    description: 'Attempted directory traversal beyond permitted prototype sandbox'
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
 * Checks an input string against security tamper signatures.
 * Returns { isViolation: boolean, category, description, pattern }
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
  try {
    const raw = await fs.readFile(LOCK_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { locks: {} };
  }
}

/**
 * Writes the security lockfile to disk.
 */
export async function saveLockData(data) {
  try {
    await fs.writeFile(LOCK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save security lock data:', err.message);
  }
}

/**
 * Checks whether an IP or client ID is currently suspended.
 * Returns { isSuspended: boolean, remainingMs, lock }
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
  data.locks['global'] = lock; // also apply globally to prototype workstation
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
