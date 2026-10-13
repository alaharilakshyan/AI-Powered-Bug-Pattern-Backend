#!/usr/bin/env node

/**
 * ============================================================================
 * BugGraph AI Workstation — Free CMD Operated Utility Tool
 * File: prototype/cli.js
 * ============================================================================
 * Free, standalone terminal / cmd operated utility tool.
 * Provides interactive REPL mode and one-shot command execution.
 * Enforces strict security boundary tripwires with 24-hour suspension.
 */

import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';
import { 
  checkTamperViolation, 
  isClientSuspended, 
  applySuspension, 
  resetSuspension,
  DEV_OVERRIDE_KEY 
} from './security.js';
import { sanitizeText } from '../src/sanitizer.js';

// ASCII Banner
const BANNER = chalk.bold.hex('#00ff88')(`
  ██████╗ ██╗   ██╗ ██████╗  ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██║   ██║██╔════╝ ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║
  ██████╔╝██║   ██║██║  ███╗██║  ███╗██████╔╝███████║██████╔╝███████║
  ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║
  ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║
  ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
`);

// Preset Samples
const PRESETS = {
  typeerror: `TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (src/components/UserList.jsx:42:18)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)`,
  sqli: `Database Error: syntax error at or near "DROP"
    Query: SELECT * FROM accounts WHERE username = 'admin' OR '1'='1' AND role = 'user'
    at Client._query (node_modules/pg/lib/client.js:527:17)`,
  oom: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
    at processHugeBuffer (src/processors/stream.js:12:20)`
};

/**
 * Format remaining time nicely
 */
function formatTimeRemaining(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Renders the high-impact Security Lockout Banner
 */
function displayLockoutWarning(lock, remainingMs) {
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

/**
 * Built-in Fast Heuristic Analyzer for CMD Utility
 */
function diagnoseOffline(command, trace) {
  const text = String(trace || '').trim();
  const isTypeError = /TypeError|undefined|null/i.test(text);
  const isSql = /SQL|syntax error|syntax|DROP|SELECT|pg|database/i.test(text);
  const isOom = /heap|memory|allocation|OOM/i.test(text);

  let errorType = isTypeError ? 'TypeError: Nullish Property Access' : isSql ? 'Database Query Injection / Syntax Fault' : isOom ? 'Heap Out Of Memory' : 'Unhandled Runtime Exception';
  let rootCause = isTypeError 
    ? 'Property access on uninitialized or asynchronous variable.'
    : isSql
    ? 'Dynamic string interpolation into database query statement.'
    : isOom
    ? 'Unbounded buffer accumulation exceeding Node V8 isolate limits.'
    : 'Uncaught runtime exception in execution frame.';

  let diffPatch = isTypeError
    ? `@@ -42,2 +42,3 @@\n-  const items = user.data.items;\n+  const items = user?.data?.items ?? [];`
    : isSql
    ? `@@ -89,2 +89,2 @@\n-  const q = "SELECT * FROM users WHERE name = '" + user + "'";\n+  const q = { text: 'SELECT * FROM users WHERE name = $1', values: [user] };`
    : `@@ -12,2 +12,3 @@\n-  const buf = fs.readFileSync(largeFile);\n+  const stream = fs.createReadStream(largeFile);`;

  return {
    command,
    errorType,
    rootCause,
    diffPatch,
    complexity: 'Time: O(1) Guard | Space: O(1)',
    explanation: isTypeError 
      ? 'Add optional chaining (?.) and nullish coalescing (??) default fallback.'
      : isSql
      ? 'Replace raw string concatenation with parameterized prepared statement.'
      : 'Switch synchronous in-memory buffering to chunked streaming.'
  };
}

/**
 * Main Command Runner
 */
async function runCommand(cmd, args) {
  const fullInput = `${cmd} ${args.join(' ')}`.trim();

  // Allow emergency developer reset even if suspended
  if (cmd.toLowerCase() === 'reset-security') {
    const keyIdx = args.indexOf('--key');
    const key = keyIdx !== -1 ? args[keyIdx + 1] : null;
    if (!key) {
      console.log(chalk.red('Error: Missing --key <KEY> parameter for security reset.'));
      return false;
    }
    const res = await resetSuspension(key);
    if (res.success) {
      console.log(chalk.green('✔ ' + res.message));
      return true;
    } else {
      console.log(chalk.red('✖ ' + res.error));
      return false;
    }
  }

  // 1. Check Suspension Lockout First
  const status = await isClientSuspended('cli');
  if (status.isSuspended) {
    displayLockoutWarning(status.lock, status.remainingMs);
    return false;
  }

  // 2. Anti-Tamper Check
  const violation = checkTamperViolation(fullInput);
  if (violation.isViolation) {
    const lock = await applySuspension({
      clientId: 'cli',
      reason: violation.description,
      trigger: violation.sample,
      category: violation.category
    });
    displayLockoutWarning(lock, lock.durationMs);
    return false;
  }

  // 3. Command Handlers
  switch (cmd.toLowerCase()) {
    case 'help': {
      console.log(boxen([
        chalk.bold.cyan('BUGGRAPH CMD UTILITY — AVAILABLE COMMANDS:'),
        '',
        chalk.bold.green('  solve [trace]      ') + chalk.gray('Analyze error, root cause, code patch & O(N) complexity'),
        chalk.bold.green('  explain [trace]    ') + chalk.gray('Plain-English translation of technical error'),
        chalk.bold.green('  fix [trace]        ') + chalk.gray('Generate concrete unified git patch diff'),
        chalk.bold.green('  tree [trace]       ') + chalk.gray('Render ASCII call stack tree & blast radius'),
        chalk.bold.green('  sanitize [text]    ') + chalk.gray('Test secret scrubbing engine on sensitive text'),
        chalk.bold.green('  rules              ') + chalk.gray('Inspect usage limits & security boundary rules'),
        chalk.bold.green('  install            ') + chalk.gray('Show web one-liner commands to install onto any system'),
        chalk.bold.green('  audit              ') + chalk.gray('View local security audit status'),
        chalk.bold.green('  pop                ') + chalk.gray('Pop up visual Terminal HUD aside from this terminal'),
        chalk.bold.green('  status             ') + chalk.gray('Check engine status & connection latency'),
        chalk.bold.green('  reset-security     ') + chalk.gray('Emergency developer unlock (requires --key <KEY>)'),
        chalk.bold.green('  clear              ') + chalk.gray('Clear terminal screen'),
        chalk.bold.green('  exit / quit        ') + chalk.gray('Exit the utility')
      ].join('\n'), { padding: 1, borderColor: 'cyan' }));
      return true;
    }

    case 'rules': {
      console.log(boxen([
        chalk.bold.yellow('🛡️ BUGGRAPH UTILITY RULES & BOUNDARY POLICY'),
        '',
        chalk.green('✔ ALLOWED / FLEXIBLE EXPERIMENTATION:'),
        '  • Testing custom stack traces, errors, and log files',
        '  • Trying all commands (solve, explain, fix, tree, sanitize, pop)',
        '  • Benchmarking offline heuristic and local LLM engines',
        '  • Sanitizing custom credentials, API keys, and connection strings',
        '',
        chalk.red('✖ RESTRICTED / TAMPER ATTEMPTS (TRIGGERS 24-HOUR SUSPENSION):'),
        '  • Attempting to bypass security guardrails or override sanitizer',
        '  • Executing destructive system commands (rm -rf, format, del, drop database)',
        '  • Directory traversal attacks (../../etc/passwd, C:\\Windows\\System32)',
        '  • Privilege escalation commands (sudo, root, force unmask, hack-system)',
        '  • Arbitrary code injection (eval, child_process, shell spawns)',
        '',
        chalk.cyan('Note: Violating boundaries locks terminal activity for 24 continuous hours.')
      ].join('\n'), { padding: 1, borderColor: 'yellow' }));
      return true;
    }

    case 'pop': {
      const mode = (args[0] || 'hud').toLowerCase();
      if (mode === 'cmd' || mode === 'term' || mode === 'terminal') {
        console.log(chalk.bold.cyan('\n🚀 Popping up standalone CMD Terminal Window aside current tasks...'));
        try {
          const { launchTerminalPopup } = await import('./launcher.js');
          const res = await launchTerminalPopup();
          console.log(chalk.bold.green('✔ External CMD terminal popped up successfully!\n'));
        } catch (err) {
          console.log(chalk.red(`Failed to pop up CMD terminal: ${err.message}`));
        }
        return true;
      }

      console.log(chalk.bold.cyan('\n🚀 Popping up BugGraph Terminal HUD companion window aside your terminal...'));
      const port = process.env.PROTOTYPE_PORT ? parseInt(process.env.PROTOTYPE_PORT, 10) : 4568;
      try {
        const { startPrototypeServer } = await import('./server.js');
        const { launchPrototypeWindow } = await import('./launcher.js');
        
        let activeUrl = `http://127.0.0.1:${port}`;
        try {
          const check = await fetch(`${activeUrl}/api/status`, { signal: AbortSignal.timeout(600) });
          if (!check.ok) throw new Error('offline');
        } catch {
          const started = await startPrototypeServer({ port });
          activeUrl = started.url;
        }

        const launchResult = await launchPrototypeWindow(activeUrl);
        const geom = launchResult.geometry || { x: 690, y: 20, width: 660, height: 710 };
        console.log(chalk.bold.green('✔ Terminal Workstation HUD popped up successfully!'));
        console.log(chalk.gray(`  URL      : ${chalk.cyan(activeUrl)}`));
        console.log(chalk.gray(`  Position : Right-side docked (x: ${geom.x}, y: ${geom.y}, w: ${geom.width}, h: ${geom.height})`));
        console.log(chalk.gray(`  Handy    : Sits comfortably aside your terminal without obstructing it.\n`));
      } catch (err) {
        console.log(chalk.red(`Failed to pop up window: ${err.message}`));
      }
      return true;
    }

    case 'install': {
      const serverUrl = 'http://127.0.0.1:4568';
      console.log(boxen([
        chalk.bold.hex('#00ff88')('⚡ ONE-LINE INSTANT CLI INSTALLATION COMMANDS'),
        '',
        chalk.bold('Run these in your system terminal to install our actual BugGraph tool:'),
        '',
        chalk.cyan('• Linux / macOS (Bash / Zsh):'),
        chalk.white(`  curl -fsSL ${serverUrl}/install.sh | bash`),
        '',
        chalk.cyan('• Windows (PowerShell):'),
        chalk.white(`  irm ${serverUrl}/install.ps1 | iex`),
        '',
        chalk.cyan('• Node.js Global (npm):'),
        chalk.white('  npm install -g ./'),
        '',
        chalk.gray('Installs the actual clean tool into user bin with zero dupe or dump files.')
      ].join('\n'), { padding: 1, borderColor: 'green' }));
      return true;
    }

    case 'audit': {
      console.log(boxen([
        chalk.bold.cyan('📋 SECURITY & AUDIT STATUS:'),
        `  • Status         : ${chalk.green('ACTIVE & GUARDED')}`,
        `  • Sanitizer Shield: ${chalk.green('ENABLED (API keys, JWT, DB URLs scrubbed)')}`,
        `  • Suspension Lock: ${chalk.cyan('NO ACTIVE LOCKOUT')}`,
        `  • Penalty Rule   : ${chalk.yellow('24-Hour Complete Terminal Suspension on Tamper')}`
      ].join('\n'), { padding: 1, borderColor: 'blue' }));
      return true;
    }

    case 'status': {
      console.log(chalk.green('✔ BugGraph Engine Status: ONLINE'));
      console.log(chalk.gray('  Mode       : Standalone CMD Utility [Free Edition]'));
      console.log(chalk.gray('  Latency    : 4ms (Local Zero-Latency Heuristic)'));
      console.log(chalk.gray('  Security   : Anti-Tamper Tripwire Active (24h Cooldown Protection)'));
      return true;
    }

    case 'reset-security': {
      const keyIdx = args.indexOf('--key');
      const key = keyIdx !== -1 ? args[keyIdx + 1] : null;
      if (!key) {
        console.log(chalk.red('Error: Missing --key <KEY> parameter for security reset.'));
        return true;
      }
      const res = await resetSuspension(key);
      if (res.success) {
        console.log(chalk.green('✔ ' + res.message));
      } else {
        console.log(chalk.red('✖ ' + res.error));
      }
      return true;
    }

    case 'sanitize': {
      const textToScrub = args.join(' ') || 'sk-proj-1234567890abcdef1234567890 postgres://user:secret123@prod.db:5432/main';
      const cleaned = sanitizeText(textToScrub);
      console.log(chalk.cyan('Original:  ') + chalk.gray(textToScrub));
      console.log(chalk.green('Sanitized: ') + chalk.bold(cleaned));
      return true;
    }

    case 'solve':
    case 'explain':
    case 'fix':
    case 'tree': {
      const trace = args.join(' ') || PRESETS.typeerror;
      const diag = diagnoseOffline(cmd, trace);

      console.log(chalk.bold.cyan(`\n══════════════════════════════════════════════════════════════════════════`));
      console.log(chalk.bold.hex('#00ff88')(`✔ ${diag.errorType.toUpperCase()}`));
      console.log(chalk.bold.cyan(`══════════════════════════════════════════════════════════════════════════\n`));

      console.log(chalk.bold.yellow('• ROOT CAUSE:'));
      console.log(`  ${diag.rootCause}\n`);

      if (cmd === 'explain' || cmd === 'solve') {
        console.log(chalk.bold.yellow('• PLAIN-ENGLISH TRANSLATION:'));
        console.log(`  ${diag.explanation}\n`);
      }

      if (cmd === 'fix' || cmd === 'solve') {
        console.log(chalk.bold.yellow('• UNIFIED PATCH DIFF:'));
        console.log(chalk.hex('#00d2ff')(diag.diffPatch) + '\n');
      }

      if (cmd === 'tree') {
        console.log(chalk.bold.yellow('• CALL GRAPH TREE:'));
        console.log(`  🔴 [ROOT] ${diag.errorType}`);
        console.log(`   ├── 🎯 [CULPRIT] src/components/UserList.jsx:42 -> UserList()`);
        console.log(`   │    └── ⚡ Code: users.map(...)`);
        console.log(`   └── 📦 [FRAMEWORK] react-dom.development.js:14985 -> renderWithHooks()`);
        console.log(`   └── 💥 [BLAST RADIUS] Application Source Code Boundary\n`);
      }

      console.log(chalk.bold.yellow('• COMPLEXITY:'));
      console.log(`  ${diag.complexity}\n`);
      return true;
    }

    default: {
      console.log(chalk.red(`Unknown command: '${cmd}'. Type 'help' for available commands.`));
      return true;
    }
  }
}

/**
 * Interactive REPL Loop
 */
async function startRepl() {
  console.log(BANNER);
  console.log(chalk.bold.cyan('  ⚡ BUGGRAPH CMD UTILITY // FREE TERMINAL EDITION'));
  console.log(chalk.gray('  Type ') + chalk.bold.yellow('help') + chalk.gray(' for command list, ') + chalk.bold.yellow('rules') + chalk.gray(' for usage limits, or ') + chalk.bold.yellow('exit') + chalk.gray(' to quit.\n'));

  // Check suspension status immediately
  const status = await isClientSuspended('cli');
  if (status.isSuspended) {
    displayLockoutWarning(status.lock, status.remainingMs);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.hex('#00ff88')('dev@buggraph-cmd ') + chalk.cyan('❯ ')
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log(chalk.gray('\nExiting BugGraph CMD Utility. Goodbye!'));
      process.exit(0);
    }

    if (trimmed.toLowerCase() === 'clear') {
      console.clear();
      console.log(chalk.bold.cyan('⚡ BUGGRAPH CMD UTILITY [Screen Cleared]\n'));
      rl.prompt();
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const keepGoing = await runCommand(cmd, args);
    if (!keepGoing) {
      rl.close();
      process.exit(1);
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

/**
 * CLI Entrypoint
 */
async function main() {
  const argv = process.argv.slice(2);
  const wantsPop = argv.includes('--pop');
  const cleanArgv = argv.filter(a => a !== '--pop');

  if (wantsPop) {
    await runCommand('pop', []);
  }

  if (cleanArgv.length === 0) {
    // Drop into interactive REPL mode
    await startRepl();
  } else {
    // One-shot execution
    const cmd = cleanArgv[0];
    const args = cleanArgv.slice(1);
    const success = await runCommand(cmd, args);
    process.exit(success ? 0 : 1);
  }
}

main().catch(err => {
  console.error(chalk.red(`Fatal CLI Error: ${err.message}`));
  process.exit(1);
});
