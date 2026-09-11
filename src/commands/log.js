import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { postBugReport } from '../api.js';
import { sanitizeText } from '../sanitizer.js';
import { resolveTraceInput, isPiped } from '../input.js';

export async function logCommand(options = {}) {
  let title = options.title;
  let description = options.description;
  let stackTrace = options.stackTrace || '';
  let severity = options.severity || 'medium';
  let component = options.component || 'default-service';

  // If trace file or piped input is available, resolve trace
  if (options.file || isPiped()) {
    stackTrace = await resolveTraceInput({ options });
  }

  // Interactive prompt if missing title/desc in TTY mode
  if (!isPiped() && (!title || !description)) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Bug Title:',
        when: !title,
        validate: input => input.trim() ? true : 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Bug Description:',
        when: !description,
        validate: input => input.trim() ? true : 'Description is required'
      },
      {
        type: 'list',
        name: 'severity',
        message: 'Severity Level:',
        choices: ['low', 'medium', 'high', 'critical'],
        when: !options.severity,
        default: 'medium'
      },
      {
        type: 'input',
        name: 'component',
        message: 'Affected Component / Service:',
        when: !options.component,
        default: 'default-service'
      }
    ]);

    title = title || answers.title;
    description = description || answers.description;
    severity = options.severity || answers.severity;
    component = options.component || answers.component;
  }

  const spinner = ora('Ingesting bug log into central ledger...').start();

  try {
    const payload = {
      title: sanitizeText(title || 'Piped Bug Log'),
      description: sanitizeText(description || 'Automated trace ingestion from CLI'),
      stackTrace: sanitizeText(stackTrace),
      severity,
      component: sanitizeText(component),
      tags: options.tags ? options.tags.split(',') : []
    };

    const result = await postBugReport(payload);
    spinner.succeed(chalk.green(`Bug report ingested successfully! (ID: ${result.data?.id || 'bug_' + Math.random().toString(36).substr(2, 6)})`));
    console.log(chalk.gray(`Target Component: ${component} | Severity: ${severity}`));
  } catch (err) {
    spinner.fail(chalk.red(`Failed to post bug log: ${err.message}`));
    process.exit(1);
  }
}
