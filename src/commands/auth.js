import chalk from 'chalk';
import { setToken, setEndpoint, getConfig } from '../config.js';
import { checkStatus } from '../api.js';

export async function authCommand(token, options = {}) {
  if (!token) {
    console.error(chalk.red('Error: Access token is required. Usage: buggraph auth <token>'));
    process.exit(1);
  }

  if (options.endpoint) {
    setEndpoint(options.endpoint);
    console.log(chalk.gray(`Updated API base endpoint to: ${options.endpoint}`));
  }

  setToken(token);
  console.log(chalk.green(`✓ Authentication token registered successfully in ~/.buggraph/config.json`));

  const status = await checkStatus();
  if (status.online) {
    console.log(chalk.cyan(`✓ Successfully connected to BugGraph backend server at ${status.endpoint}`));
  } else {
    console.log(chalk.yellow(`! Token stored, but could not connect to server at ${status.endpoint}. (${status.error})`));
  }
}
