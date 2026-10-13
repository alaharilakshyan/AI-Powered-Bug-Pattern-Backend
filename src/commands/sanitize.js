import chalk from 'chalk';
import boxen from 'boxen';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';

export async function sanitizeCommand(options = {}) {
  try {
    const rawInput = await resolveTraceInput({
      options,
      title: 'BugGraph Secret Sanitizer Shield'
    });

    if (!rawInput) {
      console.error(chalk.red('Error: Input text is empty. Provide text or pass --file <path>.'));
      process.exit(1);
    }

    const cleaned = sanitizeText(rawInput);

    if (options.json) {
      console.log(JSON.stringify({ originalLength: rawInput.length, sanitizedLength: cleaned.length, sanitized: cleaned }, null, 2));
      return;
    }

    console.log(boxen([
      chalk.bold.hex('#00ff88')('🛡️  BUGGRAPH SECRET SANITIZER SHIELD'),
      '',
      chalk.gray('Original Length : ') + chalk.white(rawInput.length + ' characters'),
      chalk.gray('Sanitized Length: ') + chalk.white(cleaned.length + ' characters'),
      chalk.gray('Scrubbed Fields : ') + chalk.green('API Keys, Passwords, Bearer Tokens, DB Connection URIs')
    ].join('\n'), { padding: 1, borderColor: 'green' }));

    console.log(chalk.bold.cyan('\nSANITIZED OUTPUT:\n'));
    console.log(chalk.white(cleaned));
    console.log();
  } catch (err) {
    console.error(chalk.red(`Failed to sanitize input: ${err.message}`));
    process.exit(1);
  }
}
