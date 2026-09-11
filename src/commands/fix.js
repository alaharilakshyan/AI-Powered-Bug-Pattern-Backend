import chalk from 'chalk';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';
import { generateFix } from '../api.js';
import { formatFixResponse } from '../ui/formatter.js';

export async function fixCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({ 
      options, 
      title: 'BugGraph Concrete Code Fix Generator' 
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste an error or pass --file error.log.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Building concrete code patch fix...').start();

    const payload = {
      error: sanitizedTrace,
      stackTrace: sanitizedTrace,
      file: options.file || ''
    };

    const response = await generateFix(payload);
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    console.log(formatFixResponse(response));
  } catch (err) {
    console.error(chalk.red(`Failed to generate fix: ${err.message}`));
    process.exit(1);
  }
}
