import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';
import { sendDebugSession } from '../api.js';
import { getConfig, setActiveSessionId } from '../config.js';

export async function debugCommand(options = {}) {
  const cfg = getConfig();
  let sessionId = cfg.activeSessionId;

  console.log(boxen(
    `${chalk.bold.magenta('🐞 BUGGRAPH INTERACTIVE AI DEBUG SESSION')}\n\n` +
    `${chalk.gray('Session ID:')} ${sessionId ? chalk.cyan(sessionId) : chalk.yellow('New Session')}\n` +
    `${chalk.gray('Type your message or paste code. Type "exit" to quit.')}`,
    { padding: 1, borderColor: 'magenta', borderStyle: 'round' }
  ));

  let initialInput = '';
  if (options.file || process.stdin.isTTY === false) {
    initialInput = await resolveTraceInput({ options });
  }

  let conversationActive = true;
  let currentPrompt = initialInput || null;

  while (conversationActive) {
    if (!currentPrompt) {
      const { userMsg } = await inquirer.prompt([
        {
          type: 'input',
          name: 'userMsg',
          message: chalk.cyan('Developer >'),
          validate: val => val.trim() ? true : 'Please enter a message or command.'
        }
      ]);

      if (['exit', 'quit', 'done', 'q'].includes(userMsg.trim().toLowerCase())) {
        console.log(chalk.gray('Ending debug session. Goodbye!'));
        setActiveSessionId(null);
        break;
      }

      currentPrompt = userMsg;
    }

    const sanitizedMsg = sanitizeText(currentPrompt);
    const spinner = ora('AI thinking & searching knowledge graph...').start();

    try {
      const payload = {
        sessionId,
        message: sanitizedMsg,
        environment: options.environment || 'local'
      };

      const response = await sendDebugSession(payload);
      spinner.stop();

      sessionId = response.sessionId || sessionId;
      setActiveSessionId(sessionId);

      console.log(`\n${chalk.bold.magenta('BugGraph AI >')}\n${response.reply || response.summary || 'Context received.'}\n`);

      if (response.additionalContextRequired) {
        console.log(chalk.yellow('💡 Additional context is needed to diagnose this bug precisely.'));
      }

      // Reset prompt for next turn
      currentPrompt = null;

      if (options.nonInteractive) {
        conversationActive = false;
      }
    } catch (err) {
      spinner.fail(chalk.red(`Debug session error: ${err.message}`));
      break;
    }
  }
}
