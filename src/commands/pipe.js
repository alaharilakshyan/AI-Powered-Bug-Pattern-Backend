import chalk from 'chalk';
import ora from 'ora';
import { postBugReport } from '../api.js';
import { sanitizeText } from '../sanitizer.js';
import { resolveTraceInput } from '../input.js';

export async function pipeCommand(options = {}) {
  const spinner = ora('Reading input stream...').start();

  try {
    const rawInput = await resolveTraceInput({ options, title: 'BugGraph Pipe Stream Ingestion' });

    if (!rawInput) {
      spinner.fail(chalk.red('No stdin stream input or file content detected. Usage: cat logs.txt | buggraph pipe'));
      process.exit(1);
    }

    spinner.text = 'Sanitizing trace data and sending to API...';

    const lines = rawInput.split('\n');
    const firstLine = lines.find(l => l.trim().length > 0) || 'Piped Compiler Output';
    
    const payload = {
      title: sanitizeText(options.title || `Piped Log: ${firstLine.substring(0, 60)}`),
      description: sanitizeText(options.description || `Automated log pipe stream ingested at ${new Date().toISOString()}`),
      stackTrace: sanitizeText(rawInput),
      severity: options.severity || 'medium',
      component: sanitizeText(options.component || 'ci-pipeline'),
      tags: options.tags ? options.tags.split(',') : ['piped', 'ci-stream']
    };

    const result = await postBugReport(payload);
    spinner.succeed(chalk.green(`✓ Piped log ingested successfully! (ID: ${result.data?.id || 'bug_pipe'})`));
  } catch (err) {
    spinner.fail(chalk.red(`Failed to process piped stream: ${err.message}`));
    process.exit(1);
  }
}
