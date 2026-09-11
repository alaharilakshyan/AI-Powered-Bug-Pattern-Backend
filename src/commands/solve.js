import chalk from 'chalk';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';
import { solveError } from '../api.js';
import { formatSolveResponse } from '../ui/formatter.js';

export async function solveCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({ 
      options, 
      title: 'BugGraph AI Error Solver Workstation' 
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste an error or pass --file error.log.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Analyzing stack trace & querying BugGraph Knowledge Engine...').start();

    const payload = {
      error: sanitizedTrace,
      stackTrace: sanitizedTrace,
      language: options.language || 'auto',
      framework: options.framework || 'auto',
      component: options.component || 'workstation',
      file: options.file || ''
    };

    const response = await solveError(payload);
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    console.log(formatSolveResponse(response));
  } catch (err) {
    console.error(chalk.red(`Failed to execute AI solve: ${err.message}`));
    process.exit(1);
  }
}
