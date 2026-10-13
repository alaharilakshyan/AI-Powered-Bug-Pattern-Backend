import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';
import { 
  checkTamperViolation, 
  isClientSuspended, 
  applySuspension, 
  resetSuspension, 
  displayLockoutWarning 
} from '../security.js';
import { printBanner } from '../ui/formatter.js';
import { solveCommand } from './solve.js';
import { explainCommand } from './explain.js';
import { fixCommand } from './fix.js';
import { blastRadiusCommand } from './blastRadius.js';
import { similarityCommand } from './similarity.js';
import { cveCommand } from './cve.js';
import { triageCommand } from './triage.js';
import { benchmarkCommand } from './benchmark.js';
import { patchTestCommand } from './patchTest.js';
import { sanitizeCommand } from './sanitize.js';
import { statusCommand } from './status.js';
import { popCommand } from './pop.js';
import { rulesCommand, auditCommand, installCommand, resetSecurityCommand } from './securityCommands.js';

const SHELL_COMMANDS = [
  { cmd: 'solve', desc: 'AI error solver (root causes, code patch & O(N) complexity)' },
  { cmd: 'blast-radius', desc: 'Knowledge graph blast radius & ripple effect cascade tree' },
  { cmd: 'similarity', desc: 'Graph cluster similarity matcher & historic pattern lookup' },
  { cmd: 'cve', desc: 'Security & OWASP / CWE vulnerability threat auditor' },
  { cmd: 'triage', desc: 'Automated bug priority matrix (P0-P3) & GitHub issue generator' },
  { cmd: 'benchmark', desc: 'Big-O algorithmic complexity & memory overhead analyzer' },
  { cmd: 'patch-test', desc: 'Safe dry-run diff patch validator without mutating git state' },
  { cmd: 'explain', desc: 'Translate compiler/runtime errors into plain concepts' },
  { cmd: 'fix', desc: 'Generate unified git patch diff' },
  { cmd: 'sanitize', desc: 'Redact credentials, tokens, and DB URLs from text or logs' },
  { cmd: 'pop', desc: 'Pop up visual companion HUD or CMD window aside terminal' },
  { cmd: 'rules', desc: 'Inspect allowed flexibility vs 24h lockout security boundaries' },
  { cmd: 'audit', desc: 'Inspect security posture, tamper ledger & active locks' },
  { cmd: 'install', desc: 'Show one-line clean terminal installation commands' },
  { cmd: 'status', desc: 'Inspect engine connectivity and active session' },
  { cmd: 'reset-security', desc: 'Emergency developer override to unfreeze suspension' },
  { cmd: 'clear', desc: 'Clear terminal screen' },
  { cmd: 'help', desc: 'List all commands and tools' },
  { cmd: 'exit', desc: 'Quit interactive shell' }
];

export async function runShellCommand(rawLine) {
  const trimmed = String(rawLine || '').trim();
  if (!trimmed) return true;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const payload = args.join(' ');

  // Allow emergency developer reset even if suspended
  if (cmd === 'reset-security') {
    const keyIdx = args.indexOf('--key');
    const key = keyIdx !== -1 ? args[keyIdx + 1] : args[0];
    await resetSecurityCommand({ key });
    return true;
  }

  // 1. Suspension Check
  const status = await isClientSuspended('cli');
  if (status.isSuspended) {
    displayLockoutWarning(status.lock, status.remainingMs);
    return false;
  }

  // 2. Anti-Tamper Check
  const violation = checkTamperViolation(trimmed);
  if (violation.isViolation) {
    const lock = await applySuspension({
      clientId: 'cli',
      reason: violation.description,
      trigger: violation.sample,
      category: violation.category
    });
    displayLockoutWarning(lock, 24 * 60 * 60 * 1000);
    return false;
  }

  // Execute Commands
  switch (cmd) {
    case 'help': {
      console.log(boxen([
        chalk.bold.hex('#00ff88')('⚡ BUGGRAPH CLI WORKSTATION // COMMAND DIRECTORY'),
        '',
        ...SHELL_COMMANDS.map(c => `  ${chalk.bold.cyan(c.cmd.padEnd(16))} : ${chalk.gray(c.desc)}`),
        '',
        chalk.yellow('Tip: You can pass error traces or files directly to any command.')
      ].join('\n'), { padding: 1, borderColor: 'cyan' }));
      return true;
    }

    case 'solve':
      await solveCommand({ trace: payload || undefined });
      return true;

    case 'explain':
      await explainCommand({ trace: payload || undefined });
      return true;

    case 'fix':
      await fixCommand({ trace: payload || undefined });
      return true;

    case 'blast-radius':
    case 'tree':
      await blastRadiusCommand({ trace: payload || undefined });
      return true;

    case 'similarity':
    case 'cluster':
      await similarityCommand({ trace: payload || undefined });
      return true;

    case 'cve':
    case 'vuln':
      await cveCommand({ trace: payload || undefined });
      return true;

    case 'triage':
      await triageCommand({ trace: payload || undefined });
      return true;

    case 'benchmark':
    case 'bench':
    case 'complexity':
      await benchmarkCommand({ trace: payload || undefined });
      return true;

    case 'patch-test':
    case 'dry-run':
      await patchTestCommand({ trace: payload || undefined });
      return true;

    case 'sanitize':
      await sanitizeCommand({ trace: payload || undefined });
      return true;

    case 'status':
      await statusCommand();
      return true;

    case 'rules':
      rulesCommand();
      return true;

    case 'audit':
      await auditCommand();
      return true;

    case 'install':
      installCommand();
      return true;

    case 'pop': {
      const isCmd = args.includes('cmd') || args.includes('term');
      await popCommand({ cmd: isCmd });
      return true;
    }

    default:
      console.log(chalk.red(`Unknown command: '${cmd}'. Type 'help' for available commands.`));
      return true;
  }
}

export async function startInteractiveShell() {
  printBanner();
  console.log(chalk.bold.cyan('  ⚡ BUGGRAPH INTERACTIVE SHELL // CYBERPUNK HUD EDITION'));
  console.log(chalk.gray('  Type ') + chalk.bold.yellow('help') + chalk.gray(' for directory, ') + chalk.bold.yellow('rules') + chalk.gray(' for boundaries, ') + chalk.bold.yellow('pop') + chalk.gray(' for side-dock GUI, or ') + chalk.bold.yellow('exit') + chalk.gray(' to quit.\n'));

  const status = await isClientSuspended('cli');
  if (status.isSuspended) {
    displayLockoutWarning(status.lock, status.remainingMs);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.bold.hex('#00ff88')('buggraph') + chalk.gray(' ❯ '),
    completer: (line) => {
      const hits = SHELL_COMMANDS.map(c => c.cmd).filter(c => c.startsWith(line.trim()));
      return [hits.length ? hits : SHELL_COMMANDS.map(c => c.cmd), line];
    }
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log(chalk.gray('\nExiting BugGraph CLI Workstation. Happy debugging!\n'));
      process.exit(0);
    }

    if (trimmed.toLowerCase() === 'clear') {
      console.clear();
      printBanner();
      rl.prompt();
      return;
    }

    try {
      const keepGoing = await runShellCommand(trimmed);
      if (!keepGoing) {
        rl.close();
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red(`Command Error: ${err.message}`));
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}
