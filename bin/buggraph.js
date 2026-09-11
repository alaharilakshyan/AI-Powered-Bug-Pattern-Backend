#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { printBanner } from '../src/ui/formatter.js';
import { authCommand } from '../src/commands/auth.js';
import { statusCommand } from '../src/commands/status.js';
import { logCommand } from '../src/commands/log.js';
import { pipeCommand } from '../src/commands/pipe.js';
import { solveCommand } from '../src/commands/solve.js';
import { explainCommand } from '../src/commands/explain.js';
import { fixCommand } from '../src/commands/fix.js';
import { debugCommand } from '../src/commands/debug.js';
import { popCommand } from '../src/commands/pop.js';

const program = new Command();

program
  .name('buggraph')
  .description('AI-Powered Bug-Pattern Knowledge Graph CLI Workstation & Debugging Extension')
  .version('1.0.0')
  .option('--cli', 'Run interactive terminal menu instead of Window Utility Tool');

// Window Utility Popup Command
program
  .command('pop')
  .description('Launch the dedicated BugGraph Window Utility Workstation GUI outside the terminal')
  .option('-p, --port <port>', 'Custom workstation server port', '4567')
  .action((options) => popCommand(options));

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

// AI Solve Command
program
  .command('solve')
  .description('AI error solver: analyze root causes, generate code fix, and evaluate O(n) complexity')
  .option('-f, --file <path>', 'Input log file path')
  .option('-l, --language <lang>', 'Source language (javascript, java, python, etc.)')
  .option('-w, --framework <fw>', 'Framework (react, spring, django, etc.)')
  .option('-c, --component <name>', 'Component name')
  .option('--json', 'Output raw structured JSON payload')
  .action((options) => solveCommand(options));

// AI Explain Command
program
  .command('explain')
  .description('Explain compiler or runtime errors in plain technical terms')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((options) => explainCommand(options));

// AI Fix Generator Command
program
  .command('fix')
  .description('Generate concrete code patch fix with diffs and side-effect warnings')
  .option('-f, --file <path>', 'Input log file path')
  .option('--json', 'Output raw structured JSON payload')
  .action((options) => fixCommand(options));

// AI Interactive Debugging Command
program
  .command('debug')
  .description('Start or resume interactive multi-turn AI debugging session')
  .option('-f, --file <path>', 'Initial log or source code file path')
  .option('--non-interactive', 'Run single non-interactive turn (for CI/CD)')
  .action((options) => debugCommand(options));

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
        pageSize: 9,
        choices: [
          { name: '🖥️   Launch Window Utility Tool (Pop up GUI Workstation)', value: 'pop' },
          { name: '🔍  AI Error Solver (Analyze trace, root cause & O(N) complexity)', value: 'solve' },
          { name: '📖  Error Explainer (Translate compiler & runtime errors into plain terms)', value: 'explain' },
          { name: '🛠️  Generate Code Fix Patch (Produce diff patch & safety analysis)', value: 'fix' },
          { name: '🐞  Interactive AI Debug Session (Multi-turn conversational debugger)', value: 'debug' },
          { name: '📥  Ingest Bug Log (Post trace into central BugGraph ledger)', value: 'log' },
          { name: '⚡  Stream Pipe Ingestion (Process piped logs or stdin buffers)', value: 'pipe' },
          { name: '⚙️  Workstation Status & Config (View status, endpoint & active session)', value: 'status' },
          { name: '🗝️  Register Auth Token (Set developer secret token & API URL)', value: 'auth' },
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
      if (action === 'pop') {
        await popCommand({});
      } else if (action === 'solve') {
        await solveCommand({});
      } else if (action === 'explain') {
        await explainCommand({});
      } else if (action === 'fix') {
        await fixCommand({});
      } else if (action === 'debug') {
        await debugCommand({});
      } else if (action === 'log') {
        await logCommand({});
      } else if (action === 'pipe') {
        await pipeCommand({});
      } else if (action === 'status') {
        await statusCommand();
      } else if (action === 'auth') {
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

if (process.argv.length <= 2) {
  if (!process.stdin.isTTY) {
    program.outputHelp();
    process.exit(0);
  }
  popCommand({});
} else {
  program.parse(process.argv);
  if (program.opts().cli) {
    runInteractiveMenu();
  }
}

