import chalk from 'chalk';
import boxen from 'boxen';
import { getConfig } from '../config.js';
import { checkStatus } from '../api.js';

export async function statusCommand() {
  const cfg = getConfig();
  const status = await checkStatus();

  const lines = [
    `${chalk.bold.cyan('BUGGRAPH CLI WORKSTATION STATUS')}\n`,
    `${chalk.bold('Execution Mode')} : ${chalk.green.bold(status.mode || 'Standalone Local AI Engine')}`,
    `${chalk.bold('Endpoint Target')}: ${cfg.endpoint}`,
    `${chalk.bold('Token Status')  } : ${cfg.token ? chalk.green('VALID (' + cfg.token.substring(0, 10) + '...)') : chalk.yellow('LOCAL DEV TOKEN')}`,
    `${chalk.bold('Active Session')} : ${cfg.activeSessionId ? chalk.yellow(cfg.activeSessionId) : chalk.gray('None')}`
  ];

  if (status.note) {
    lines.push(`\n${chalk.cyan('Note:')} ${status.note}`);
  } else {
    lines.push(`\n${chalk.green('✓ Connected to BugGraph Knowledge Engine.')}`);
  }

  console.log(boxen(lines.join('\n'), {
    padding: 1,
    borderColor: 'cyan',
    borderStyle: 'round'
  }));
}
