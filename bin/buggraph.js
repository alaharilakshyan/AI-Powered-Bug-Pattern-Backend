#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { printBanner } from '../src/ui/formatter.js';
import { 
  checkTamperViolation, 
  isClientSuspended, 
  applySuspension, 
  displayLockoutWarning 
} from '../src/security.js';

// Core Commands
import { authCommand } from '../src/commands/auth.js';
import { statusCommand } from '../src/commands/status.js';
import { logCommand } from '../src/commands/log.js';
import { pipeCommand } from '../src/commands/pipe.js';
import { solveCommand } from '../src/commands/solve.js';
import { explainCommand } from '../src/commands/explain.js';
import { fixCommand } from '../src/commands/fix.js';
import { debugCommand } from '../src/commands/debug.js';
import { popCommand } from '../src/commands/pop.js';

// Advanced & Unique Knowledge Graph Commands
import { blastRadiusCommand } from '../src/commands/blastRadius.js';
import { similarityCommand } from '../src/commands/similarity.js';
import { cveCommand } from '../src/commands/cve.js';
import { triageCommand } from '../src/commands/triage.js';
import { benchmarkCommand } from '../src/commands/benchmark.js';
import { patchTestCommand } from '../src/commands/patchTest.js';
import { sanitizeCommand } from '../src/commands/sanitize.js';
import { 
  rulesCommand, 
  auditCommand, 
  resetSecurityCommand, 
  installCommand 
} from '../src/commands/securityCommands.js';
import { startInteractiveShell } from '../src/commands/shell.js';

const program = new Command();

program
  .name('buggraph')
  .description('AI-Powered Bug-Pattern Knowledge Graph CLI Workstation & Debugging Extension')
  .version('1.0.0')
  .option('--cli', 'Run interactive selection menu')
  .option('--shell', 'Run interactive cyberpunk REPL shell')
  .option('--repl', 'Alias for --shell');

// Window Utility Popup Command
program
  .command('pop')
  .description('Launch the dedicated BugGraph Window Utility Workstation GUI outside the terminal')
  .option('-p, --port <port>', 'Custom workstation server port', '4567')
  .option('--cmd', 'Pop up native Windows CMD terminal window instead of browser HUD')
  .option('--term', 'Alias for --cmd')
  .action((options) => popCommand(options));

// Interactive Shell Command
program
  .command('shell')
  .description('Launch interactive cyberpunk REPL shell with autocomplete & command history')
  .action(() => startInteractiveShell());

// AI Solve Command
program
  .command('solve [trace...]')
  .description('AI error solver: analyze root causes, generate code fix, and evaluate O(n) complexity')
  .option('-f, --file <path>', 'Input log file path')
  .option('-l, --language <lang>', 'Source language (javascript, java, python, etc.)')
  .option('-w, --framework <fw>', 'Framework (react, spring, django, etc.)')
  .option('-c, --component <name>', 'Component name')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return solveCommand({ ...options, trace });
  });

// Blast Radius & Graph Ripple Effect Command
program
  .command('blast-radius [trace...]')
  .alias('tree')
  .description('Knowledge graph blast radius auditor & downstream cascade failure tree')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return blastRadiusCommand({ ...options, trace });
  });

// Pattern Cluster Similarity Command
program
  .command('similarity [trace...]')
  .alias('cluster')
  .description('Match stack trace against historical bug pattern clusters & verified solutions')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return similarityCommand({ ...options, trace });
  });

// Security & CWE Vulnerability Auditor
program
  .command('cve [trace...]')
  .alias('vuln')
  .description('Audit stack trace for CWE/CVE security risks, CVSS score & OWASP Top 10')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return cveCommand({ ...options, trace });
  });

// Automated Triage & Ticket Generator
program
  .command('triage [trace...]')
  .description('Calculate priority tier (P0-P3), SLA target & generate GitHub/Jira markdown ticket')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return triageCommand({ ...options, trace });
  });

// Algorithmic Complexity Benchmark
program
  .command('benchmark [trace...]')
  .alias('bench')
  .description('Evaluate Big-O time/space complexity, GC churn & memory overhead')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return benchmarkCommand({ ...options, trace });
  });

// Safe Dry-Run Patch Tester
program
  .command('patch-test [diff...]')
  .alias('dry-run')
  .description('Simulate & validate diff patch application safely without mutating git state')
  .option('-f, --file <path>', 'Input diff file path')
  .action((diffParts, options) => {
    const trace = Array.isArray(diffParts) && diffParts.length ? diffParts.join(' ') : undefined;
    return patchTestCommand({ ...options, trace });
  });

// Secret Sanitizer Shield
program
  .command('sanitize [text...]')
  .description('Scrub API keys, passwords, bearer tokens & DB connection strings from input')
  .option('-f, --file <path>', 'Input file path to sanitize')
  .option('--json', 'Output raw structured JSON payload')
  .action((textParts, options) => {
    const trace = Array.isArray(textParts) && textParts.length ? textParts.join(' ') : undefined;
    return sanitizeCommand({ ...options, trace });
  });

// Rules & Boundaries Command
program
  .command('rules')
  .description('Inspect allowed flexibility vs 24-hour lockout security boundaries')
  .action(() => rulesCommand());

// Security Audit & Ledger Command
program
  .command('audit')
  .description('Inspect security posture, tamper ledger & active suspension status')
  .action(() => auditCommand());

// Reset Security Suspension Command
program
  .command('reset-security')
  .description('Emergency developer override key to clear 24-hour security suspension')
  .requiredOption('--key <key>', 'Emergency developer secret key')
  .action((options) => resetSecurityCommand(options));

// Clean Web Installer Command
program
  .command('install')
  .description('Display one-line terminal commands to install the clean BugGraph CLI')
  .action(() => installCommand());

// AI Explain Command
program
  .command('explain [trace...]')
  .description('Explain compiler or runtime errors in plain technical terms')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return explainCommand({ ...options, trace });
  });

// AI Fix Generator Command
program
  .command('fix [trace...]')
  .description('Generate concrete code patch fix with diffs and side-effect warnings')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((traceParts, options) => {
    const trace = Array.isArray(traceParts) && traceParts.length ? traceParts.join(' ') : undefined;
    return fixCommand({ ...options, trace });
  });

// AI Interactive Debugging Command
program
  .command('debug')
  .description('Start or resume interactive multi-turn AI debugging session')
  .option('-f, --file <path>', 'Initial log or source code file path')
  .option('--non-interactive', 'Run single non-interactive turn (for CI/CD)')
  .action((options) => debugCommand(options));

// Authentication Command
program
  .command('auth <token>')
  .description('Authenticate and register developer secret token in ~/.buggraph/config.json')
  .option('-e, --endpoint <url>', 'Set custom backend API base URL')
  .action((token, options) => authCommand(token, options));

// System Status Command
program
  .command('status')
  .description('Check CLI configuration, backend connectivity, and auth token status')
  .action(() => statusCommand());

// Ingest Log Command
program
  .command('log')
  .description('Ingest a bug report or stack trace into central BugGraph ledger')
  .option('-t, --title <title>', 'Bug report title')
  .option('-d, --description <desc>', 'Bug description summary')
  .option('-s, --stack-trace <trace>', 'Raw compiler/runtime stack trace')
  .option('-v, --severity <level>', 'Severity level (low, medium, high, critical)', 'medium')
  .option('-c, --component <service>', 'Affected component or microservice', 'default-service')
  .option('--tags <tags>', 'Comma-separated tags (e.g. idor,sqli,react)')
  .option('-f, --file <path>', 'Read stack trace from log file')
  .action((options) => logCommand(options));

// Stream Pipe Ingestion Command
program
  .command('pipe')
  .description('Stream compiler logs or error output directly into BugGraph via stdin pipe')
  .option('-t, --title <title>', 'Custom title')
  .option('-d, --description <desc>', 'Custom description')
  .option('-c, --component <service>', 'Target service name', 'ci-pipeline')
  .option('-v, --severity <level>', 'Severity level', 'medium')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('-f, --file <path>', 'Read stream input from file path')
  .action((options) => pipeCommand(options));

async function runInteractiveMenu() {
  printBanner();

  console.log(chalk.bold.green('  ✔ Workstation Ready') + chalk.gray(' — Select an action below (use arrow keys ↑/↓ and Enter):\n'));

  let active = true;
  while (active) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold.cyan('Select Action:'),
        pageSize: 15,
        choices: [
          { name: '🖥️   Launch Window Utility Tool (Pop up GUI Workstation)', value: 'pop' },
          { name: '⚡  Launch Interactive Shell (Cyberpunk REPL with autocomplete)', value: 'shell' },
          { name: '🔍  AI Error Solver (Analyze trace, root cause & O(N) complexity)', value: 'solve' },
          { name: '🕸️   Blast Radius Auditor (Downstream ripple effect & cascade tree)', value: 'blast' },
          { name: '🎯  Pattern Similarity Matcher (Historic clusters & verified solutions)', value: 'similarity' },
          { name: '🛡️   Security & CWE Threat Audit (CVSS score & OWASP Top 10 analysis)', value: 'cve' },
          { name: '📋  Automated Bug Triage (P0-P3 Priority tier & Markdown ticket)', value: 'triage' },
          { name: '📊  Algorithmic Complexity Benchmark (Big-O Time & Space audit)', value: 'benchmark' },
          { name: '🧪  Safe Dry-Run Patch Tester (Test unified diff without mutating git)', value: 'patch-test' },
          { name: '🔒  Secret Sanitizer Shield (Scrub API keys, passwords & tokens)', value: 'sanitize' },
          { name: '📖  Error Explainer (Translate compiler & runtime errors into plain terms)', value: 'explain' },
          { name: '🛠️   Generate Code Fix Patch (Produce diff patch & safety analysis)', value: 'fix' },
          { name: '🐞  Interactive AI Debug Session (Multi-turn conversational debugger)', value: 'debug' },
          { name: '🛡️   Security Rules & Policies (Inspect usage limits & 24h boundaries)', value: 'rules' },
          { name: '📋  Security & Compliance Audit (Inspect tamper ledger & active locks)', value: 'audit' },
          { name: '⚡  Install CLI One-Liners (Web installation commands)', value: 'install' },
          { name: '⚙️   Workstation Status & Config (View status, endpoint & session)', value: 'status' },
          { name: '🗝️   Register Auth Token (Set developer secret token & API URL)', value: 'auth' },
          new inquirer.Separator(),
          { name: '🚪  Exit Workstation', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') {
      console.log(chalk.gray('\nExiting BugGraph CLI Workstation. Happy debugging!\n'));
      break;
    }

    try {
      if (action === 'pop') await popCommand({});
      else if (action === 'shell') await startInteractiveShell();
      else if (action === 'solve') await solveCommand({});
      else if (action === 'blast') await blastRadiusCommand({});
      else if (action === 'similarity') await similarityCommand({});
      else if (action === 'cve') await cveCommand({});
      else if (action === 'triage') await triageCommand({});
      else if (action === 'benchmark') await benchmarkCommand({});
      else if (action === 'patch-test') await patchTestCommand({});
      else if (action === 'sanitize') await sanitizeCommand({});
      else if (action === 'explain') await explainCommand({});
      else if (action === 'fix') await fixCommand({});
      else if (action === 'debug') await debugCommand({});
      else if (action === 'rules') rulesCommand();
      else if (action === 'audit') await auditCommand();
      else if (action === 'install') installCommand();
      else if (action === 'status') await statusCommand();
      else if (action === 'auth') {
        const { token, endpoint } = await inquirer.prompt([
          { type: 'input', name: 'token', message: 'Enter BugGraph Developer Token:', validate: v => v.trim() ? true : 'Token is required' },
          { type: 'input', name: 'endpoint', message: 'Enter API Endpoint (press Enter for default):', default: 'http://localhost:3000' }
        ]);
        await authCommand(token, { endpoint });
      }
    } catch (err) {
      console.error(chalk.red(`Error executing action: ${err.message}`));
    }

    console.log('\n' + chalk.gray('────────────────────────────────────────────────────────────────') + '\n');
  }
}

/**
 * CLI Execution Entrypoint
 */
async function main() {
  const argv = process.argv;
  const rawArgString = argv.slice(2).join(' ').trim();

  // 1. Allow emergency security reset even if suspended
  if (argv.includes('reset-security')) {
    program.parse(argv);
    return;
  }

  // 2. Check 24-hour suspension status
  const status = await isClientSuspended('cli');
  if (status.isSuspended) {
    displayLockoutWarning(status.lock, status.remainingMs);
    process.exit(1);
  }

  // 3. Check for security tamper violation
  const violation = checkTamperViolation(rawArgString);
  if (violation.isViolation) {
    const lock = await applySuspension({
      clientId: 'cli',
      reason: violation.description,
      trigger: violation.sample,
      category: violation.category
    });
    displayLockoutWarning(lock, 24 * 60 * 60 * 1000);
    process.exit(1);
  }

  // 4. Handle Shell/REPL flags
  if (argv.includes('--shell') || argv.includes('--repl')) {
    await startInteractiveShell();
    return;
  }

  // 5. Default Invocation: Launch interactive menu if TTY and no args
  if (argv.length <= 2) {
    if (!process.stdin.isTTY) {
      program.outputHelp();
      process.exit(0);
    }
    await runInteractiveMenu();
    return;
  }

  // Parse Commander command line arguments
  program.parse(argv);
  if (program.opts().cli) {
    await runInteractiveMenu();
  }
}

main().catch(err => {
  console.error(chalk.red(`Fatal CLI Error: ${err.message}`));
  process.exit(1);
});
