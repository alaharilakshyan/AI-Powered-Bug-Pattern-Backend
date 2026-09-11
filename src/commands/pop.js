import chalk from 'chalk';
import boxen from 'boxen';
import { printBanner } from '../ui/formatter.js';
import { startWorkstationServer } from '../ui/server.js';
import { launchWindowUtility } from '../ui/launcher.js';

/**
 * Launches the BugGraph Window Utility Tool (Desktop Popup Workstation).
 */
export async function popCommand(options = {}) {
  printBanner();

  console.log(chalk.bold.cyan('🚀 Starting BugGraph Window Utility Workstation...\n'));

  try {
    const { server, port, url } = await startWorkstationServer({
      port: options.port ? parseInt(options.port, 10) : 4567
    });

    const launchResult = await launchWindowUtility(url);

    const message = [
      `${chalk.bold.green('✔ BUGGRAPH WINDOW UTILITY TOOL ACTIVE')}\n`,
      `${chalk.bold('Workstation URL')} : ${chalk.cyan.underline(url)}`,
      `${chalk.bold('Launch Mode')    } : ${chalk.yellow(launchResult.mode === 'app-window' ? 'Dedicated Desktop Window' : 'System Browser Window')}`,
      `${chalk.bold('Engine Status')  } : ${chalk.green('Ready & Connected')}\n`,
      `${chalk.gray('The workstation is running outside the terminal in its own window.')}`,
      `${chalk.gray('Press ')}${chalk.bold.yellow('Ctrl+C')}${chalk.gray(' in this terminal when finished to close.')}`
    ].join('\n');

    console.log(boxen(message, {
      padding: 1,
      borderColor: 'cyan',
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
