import fs from 'fs/promises';
import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Checks whether process.stdin is receiving piped input.
 */
export function isPiped() {
  return !process.stdin.isTTY;
}

/**
 * Reads stream content piped into stdin (e.g. cat logs.txt | buggraph solve)
 */
export async function readPipedInput() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data.trim());
    });

    process.stdin.on('error', err => {
      reject(err);
    });
  });
}

/**
 * Reads multiline input pasted by the developer directly into terminal.
 * Continues reading lines until EOF (Ctrl+D) or double empty newline.
 */
export async function readCopyPasteInput(promptTitle = 'BugGraph AI Debugger Workstation') {
  const isWin = process.platform === 'win32';
  const finishHint = isWin 
    ? 'Press Enter on an empty line (or Ctrl+Z then Enter) when finished.'
    : 'Press Enter on an empty line (or Ctrl+D) when finished.';

  const boxHeader = boxen(
    `${chalk.bold.cyan(promptTitle)}\n\n` +
    `${chalk.gray('Paste your stack trace or error log below.')}\n` +
    `${chalk.yellow(finishHint)}`,
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderColor: 'cyan',
      borderStyle: 'round'
    }
  );

  console.log(boxHeader);

  return new Promise(resolve => {
    const lines = [];
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    rl.on('line', line => {
      // If user presses Enter on an empty line after entering content, finish input
      if (lines.length > 0 && line.trim() === '') {
        rl.close();
        return;
      }
      lines.push(line);
    });

    rl.on('close', () => {
      resolve(lines.join('\n').trim());
    });
  });
}

/**
 * Reads file content given a valid file path.
 */
export async function readFileInput(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return fileContent.trim();
  } catch (err) {
    throw new Error(`Failed to read input file "${filePath}": ${err.message}`);
  }
}

/**
 * Unified resolver that automatically picks the right input source:
 * 1. Explicit file path flag (--file)
 * 2. Piped stdin stream (cat logs.txt | buggraph)
 * 3. Interactive multiline copy/paste buffer (in TTY)
 */
export async function resolveTraceInput({ options = {}, title = 'BugGraph Error Input' } = {}) {
  if (options.file) {
    return await readFileInput(options.file);
  }

  if (isPiped()) {
    return await readPipedInput();
  }

  return await readCopyPasteInput(title);
}
