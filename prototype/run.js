#!/usr/bin/env node

import chalk from 'chalk';
import boxen from 'boxen';
import { startPrototypeServer } from './server.js';
import { launchPrototypeWindow } from './launcher.js';

console.log(chalk.bold.hex('#00ff88')(`
  ██████╗ ██╗   ██╗ ██████╗  ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██║   ██║██╔════╝ ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║
  ██████╔╝██║   ██║██║  ███╗██║  ███╗██████╔╝███████║██████╔╝███████║
  ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║
  ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║
  ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
`));

console.log(chalk.bold.cyan('  ⚡ BUGGRAPH PROTOTYPE: TERMINAL WORKSTATION HUD') + chalk.gray(' [TESTING BUILD]\n'));

async function main() {
  try {
    const port = process.env.PROTOTYPE_PORT ? parseInt(process.env.PROTOTYPE_PORT, 10) : 4568;
    const { server, url } = await startPrototypeServer({ port });

    const launchResult = await launchPrototypeWindow(url);

    const message = [
      `${chalk.bold.green('✔ PROTOTYPE TERMINAL WORKSTATION RUNNING')}\n`,
      `${chalk.bold('Workstation URL')}   : ${chalk.cyan.underline(url)}`,
      `${chalk.bold('Window Mode')}       : ${chalk.yellow(launchResult.mode === 'app-window' ? 'Dedicated Desktop HUD Window' : 'System Browser')}`,
      `${chalk.bold('Offline LLM Target')}: ${chalk.hex('#00ff88')('Ollama (11434) / LM Studio (1234) / Fallback')}`,
      `${chalk.bold('Pro Features')}      : ${chalk.magenta('Telemetry, Model Switcher, Secret Scrubbing, Diff Viewer')}\n`,
      `${chalk.gray('The prototype window is running outside the terminal in its own HUD.')}`,
      `${chalk.gray('Press ')}${chalk.bold.yellow('Ctrl+C')}${chalk.gray(' in this terminal when finished to terminate.')}`
    ].join('\n');

    console.log(boxen(message, {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'round'
    }));

    const shutdown = () => {
      console.log(chalk.gray('\nClosing BugGraph Prototype Server...'));
      server.close(() => {
        console.log(chalk.gray('Server closed. Goodbye!\n'));
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error(chalk.red(`\nFailed to start Prototype Workstation: ${err.message}`));
    process.exit(1);
  }
}

main();
