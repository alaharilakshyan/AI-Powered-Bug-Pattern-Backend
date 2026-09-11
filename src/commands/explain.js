import chalk from 'chalk';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';
import { explainError } from '../api.js';
import { formatExplainResponse } from '../ui/formatter.js';

export async function explainCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({ 
      options, 
      title: 'BugGraph AI Error Explainer' 
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste an error or pass --file error.log.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Generating technical explanation...').start();

    const payload = {
      error: sanitizedTrace,
      stackTrace: sanitizedTrace,
      file: options.file || ''
    };

    const response = await explainError(payload);
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    console.log(formatExplainResponse(response));
  } catch (err) {
    console.error(chalk.red(`Failed to execute AI explain: ${err.message}`));
    process.exit(1);
  }
}
