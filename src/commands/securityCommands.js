import chalk from 'chalk';
import boxen from 'boxen';
import { isClientSuspended, resetSuspension } from '../security.js';

export function rulesCommand() {
  console.log(boxen([
    chalk.bold.yellow('🛡️ BUGGRAPH UTILITY RULES & BOUNDARY POLICY'),
    '',
    chalk.green('✔ ALLOWED / FLEXIBLE EXPERIMENTATION:'),
    '  • Testing custom stack traces, errors, and log files',
    '  • Querying all diagnostic commands (solve, explain, fix, debug, tree, blast-radius)',
    '  • Running similarity clustering, CVE audits, and algorithmic benchmarks',
    '  • Sanitizing custom credentials, API keys, and connection strings',
    '  • Popping up handy companion workstation HUD side-docked beside terminal',
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
}

export async function auditCommand() {
  const status = await isClientSuspended('cli');

  console.log(boxen([
    chalk.bold.cyan('📋 SECURITY & AUDIT STATUS:'),
    `  • Status         : ${chalk.green('ACTIVE & GUARDED')}`,
    `  • Sanitizer Shield: ${chalk.green('ENABLED (API keys, JWT, DB URLs scrubbed)')}`,
    `  • Suspension Lock: ${status.isSuspended ? chalk.red('ACTIVE (24h Cooldown)') : chalk.cyan('NO ACTIVE LOCKOUT')}`,
    `  • Penalty Rule   : ${chalk.yellow('24-Hour Complete Terminal Suspension on Tamper')}`,
    `  • Ledger Audit   : ${chalk.gray('Cryptographically sealed incident history')}`
  ].join('\n'), { padding: 1, borderColor: 'blue' }));
}

export async function resetSecurityCommand(options = {}) {
  const key = options.key;
  if (!key) {
    console.log(chalk.red('Error: Missing --key <KEY> parameter for security reset.'));
    console.log(chalk.gray('Usage: buggraph reset-security --key <DEVELOPER_KEY>'));
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

export function installCommand() {
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
}
