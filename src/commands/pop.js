import chalk from 'chalk';
import boxen from 'boxen';
import path from 'path';
import { spawn } from 'child_process';
import { printBanner } from '../ui/formatter.js';
import { startWorkstationServer } from '../ui/server.js';
import { launchWindowUtility, launchTerminalPopup } from '../ui/launcher.js';

/**
 * Launches the BugGraph Window Utility Tool (Desktop Popup Workstation).
 */
export async function popCommand(options = {}) {
  printBanner();

  if (options.cmd || options.term) {
    console.log(chalk.bold.green('🚀 Popping up standalone BugGraph CMD Terminal Window aside current tasks...\n'));
    try {
      const result = await launchTerminalPopup();
      console.log(chalk.bold.green('✔ External Terminal Window popped up successfully!'));
      console.log(chalk.gray('  Mode: Dedicated native terminal window docked aside editor.\n'));
      return;
    } catch (err) {
      console.error(chalk.red(`Failed to pop up external terminal: ${err.message}`));
      process.exit(1);
    }
  }

  // Detached background mode: starts server in background & pops window, freeing terminal immediately
  if (options.detach || options.bg) {
    console.log(chalk.bold.green('🚀 Launching BugGraph Workstation in detached background mode...\n'));
    const port = options.port ? parseInt(options.port, 10) : 4567;
    const url = `http://127.0.0.1:${port}`;

    let isRunning = false;
    try {
      const check = await fetch(`${url}/api/status`, { signal: AbortSignal.timeout(600) });
      if (check.ok) isRunning = true;
    } catch {}

    if (!isRunning) {
      const serverScriptPath = path.resolve('src/ui/server.js');
      const child = spawn(process.execPath, [serverScriptPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: { ...process.env, PORT: String(port) }
      });
      child.unref();

      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
          const res = await fetch(`${url}/api/status`, { signal: AbortSignal.timeout(300) });
          if (res.ok) { isRunning = true; break; }
        } catch {}
      }
    }

    const launchResult = await launchWindowUtility(url);

    console.log(boxen([
      chalk.bold.green('✔ BUGGRAPH WORKSTATION LAUNCHED DETACHED'),
      '',
      `${chalk.bold('Workstation URL')} : ${chalk.green.underline(url)}`,
      `${chalk.bold('Window Mode')    } : ${chalk.yellow(launchResult.mode === 'app-window' ? 'Dedicated Desktop Window' : 'System Browser Window')}`,
      `${chalk.bold('Process Mode')   } : ${chalk.cyan('Detached Background (Terminal is completely freed)')}`,
      '',
      chalk.gray('Your terminal is free to run other tasks or be closed.')
    ].join('\n'), {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'round'
    }));
    return;
  }

  console.log(chalk.bold.green('🚀 Starting BugGraph Window Utility Workstation...\n'));

  try {
    const { server, port, url } = await startWorkstationServer({
      port: options.port ? parseInt(options.port, 10) : 4567
    });

    const launchResult = await launchWindowUtility(url);

    const message = [
      `${chalk.bold.green('✔ BUGGRAPH WINDOW UTILITY TOOL ACTIVE')}\n`,
      `${chalk.bold('Workstation URL')} : ${chalk.green.underline(url)}`,
      `${chalk.bold('Launch Mode')    } : ${chalk.yellow(launchResult.mode === 'app-window' ? 'Dedicated Desktop Window' : 'System Browser Window')}`,
      `${chalk.bold('Engine Status')  } : ${chalk.green('Ready & Connected')}\n`,
      `${chalk.gray('The workstation is running outside the terminal in its own window.')}`,
      `${chalk.gray('Press ')}${chalk.bold.yellow('Ctrl+C')}${chalk.gray(' in this terminal when finished to close.')}`
    ].join('\n');

    console.log(boxen(message, {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'round'
    }));

    // Keep process alive until terminated
    return new Promise((resolve) => {
      const shutdown = () => {
        console.log(chalk.gray('\nClosing BugGraph Window Utility Workstation...'));
        server.close(() => {
          console.log(chalk.gray('Workstation server closed. Goodbye!\n'));
          resolve();
          process.exit(0);
        });
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });
  } catch (err) {
    console.error(chalk.red(`Failed to start Window Utility Workstation: ${err.message}`));
    process.exit(1);
  }
}
