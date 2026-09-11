import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Prints the BugGraph ASCII Art Banner & Welcome Header
 */
export function printBanner() {
  const terminalCols = process.stdout.columns || 80;

  // For narrow terminals (< 72 cols), use a compact clean header to prevent line-wrapping
  if (terminalCols < 72) {
    const compactHeader = 
      `${chalk.bold.cyan('⚡ BUGGRAPH WORKSTATION v1.0.0')}\n` +
      `${chalk.gray('AI-Powered Bug-Pattern Knowledge Graph Engine')}`;
    
    console.log(boxen(compactHeader, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: 'cyan',
      borderStyle: 'round'
    }));
    return;
  }

  // Pure solid block typography: uses 100% uniform solid filled blocks (██) and spaces.
  // Zero wireframe/double-line characters so every pixel renders uniformly in all terminal fonts.
  const bannerLines = [
    '  ██████  ██    ██  ██████   ██████  ██████   █████  ██████  ██   ██',
    '  ██   ██ ██    ██ ██       ██       ██   ██ ██   ██ ██   ██ ██   ██',
    '  ██████  ██    ██ ██   ███ ██   ███ ██████  ███████ ██████  ███████',
    '  ██   ██ ██    ██ ██    ██ ██    ██ ██   ██ ██   ██ ██      ██   ██',
    '  ██████   ██████   ██████   ██████  ██   ██ ██   ██ ██      ██   ██'
  ];

  const logo = 
    bannerLines.map(line => chalk.bold.cyan(line)).join('\n') + '\n\n' +
    chalk.bold.yellow('   🤖 AI-Powered Bug-Pattern Knowledge Graph Workstation v1.0.0') + '\n' +
    chalk.gray('   Real-time Log Piping • Stack Trace Analysis • Automated Fix Patching');

  console.log(boxen(logo, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderColor: 'cyan',
    borderStyle: 'round'
  }));
}


/**
 * Formats structured JSON response from POST /api/debug/solve into terminal layout.
 */
export function formatSolveResponse(data) {
  const sections = [];

  // Header Box
  const headerText = 
    `${chalk.bold.red('BUGGRAPH AI ERROR DIAGNOSIS')}\n` +
    `${chalk.gray('Type:')} ${chalk.bold.yellow(data.errorType || 'Unknown Error')}  ` +
    `${chalk.gray('Severity:')} ${formatSeverity(data.severity)}  ` +
    `${chalk.gray('Confidence:')} ${chalk.green(Math.round((data.confidence || 0.9) * 100) + '%')}`;

  sections.push(boxen(headerText, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderColor: 'red',
    borderStyle: 'round'
  }));

  // Summary & Root Cause Section
  sections.push(
    `\n${chalk.bold.cyan('🔍 SUMMARY')}\n` +
    `${data.summary || 'No summary provided.'}\n`
  );

  sections.push(
    `${chalk.bold.magenta('🎯 ROOT CAUSE')}\n` +
    `${data.rootCause || 'Root cause could not be determined.'}\n`
  );

  // Related Patterns
  if (data.relatedPatterns && data.relatedPatterns.length > 0) {
    sections.push(
      `${chalk.bold.blue('🏷️ KNOWLEDGE GRAPH PATTERNS')}\n` +
      data.relatedPatterns.map(p => `  • ${chalk.underline(p)}`).join('\n') + '\n'
    );
  }

  // Recommended Fix Section
  if (data.solution) {
    const solutionBox = boxen(
      `${chalk.bold.green('Description:')}\n${data.solution.description || 'Apply fix.'}\n\n` +
      `${chalk.bold.green('Code Fix:')}\n${chalk.bgBlack.white(data.solution.code || '// No code provided')}`,
      {
        padding: 1,
        borderColor: 'green',
        borderStyle: 'single'
      }
    );

    sections.push(
      `${chalk.bold.green('🛠️ RECOMMENDED FIX')}\n` +
      solutionBox + '\n'
    );
  }

  // Optimization & Complexity
  if (data.optimization) {
    const opt = data.optimization;
    sections.push(
      `${chalk.bold.yellow('⚡ OPTIMIZATION & COMPLEXITY')}\n` +
      `  • ${chalk.bold('Complexity')}  : ${chalk.cyan(opt.complexity || 'O(1)')}\n` +
      `  • ${chalk.bold('Performance')} : ${opt.performance || 'N/A'}\n` +
      `  • ${chalk.bold('Security')}    : ${opt.security || 'N/A'}\n` +
      `  • ${chalk.bold('Safety')}      : ${opt.maintainability || 'N/A'}\n`
    );
  }

  return sections.join('\n');
}

/**
 * Formats structured JSON response from POST /api/debug/explain into terminal layout.
 */
export function formatExplainResponse(data) {
  const sections = [];

  const titleText = `${chalk.bold.cyan('📖 BUGGRAPH ERROR EXPLAINER')}`;
  sections.push(boxen(titleText, { padding: { top: 0, bottom: 0, left: 1, right: 1 }, borderColor: 'cyan', borderStyle: 'round' }));

  sections.push(
    `\n${chalk.bold.yellow('💡 Summary:')}\n${data.summary || data.meaning || 'No description available.'}\n`
  );

  if (data.meaning) {
    sections.push(
      `${chalk.bold.blue('🧠 What This Means:')}\n${data.meaning}\n`
    );
  }

  if (data.likelyCause) {
    sections.push(
      `${chalk.bold.magenta('📍 Likely Cause:')}\n${data.likelyCause}\n`
    );
  }

  if (data.concepts && data.concepts.length > 0) {
    sections.push(
      `${chalk.bold.green('🔑 Important Concepts to Understand:')}\n` +
      data.concepts.map(c => `  • ${chalk.green(c)}`).join('\n') + '\n'
    );
  }

  if (data.nextSteps && data.nextSteps.length > 0) {
    sections.push(
      `${chalk.bold.cyan('🚀 Recommended Next Steps:')}\n` +
      data.nextSteps.map((s, idx) => `  ${idx + 1}. ${s}`).join('\n') + '\n'
    );
  }

  return sections.join('\n');
}

/**
 * Formats structured JSON response from POST /api/debug/fix into terminal layout.
 */
export function formatFixResponse(data) {
  const sections = [];

  sections.push(boxen(`${chalk.bold.green('🛠️ BUGGRAPH CONCRETE CODE FIX')}`, { padding: { top: 0, bottom: 0, left: 1, right: 1 }, borderColor: 'green', borderStyle: 'round' }));

  sections.push(
    `\n${chalk.bold.magenta('🎯 Root Cause:')}\n${data.rootCause || 'Underlying runtime defect.'}\n`
  );

  if (data.fixDiff) {
    const diffBox = boxen(chalk.white(data.fixDiff), {
      padding: 1,
      borderColor: 'gray',
      borderStyle: 'single'
    });

    sections.push(
      `${chalk.bold.green('📝 Code Diff Patch:')}\n${diffBox}\n`
    );
  }

  if (data.explanation) {
    sections.push(
      `${chalk.bold.cyan('💡 Why This Fix Works:')}\n${data.explanation}\n`
    );
  }

  if (data.sideEffects || data.considerations) {
    sections.push(
      `${chalk.bold.yellow('⚠️ Side Effects & Security Considerations:')}\n` +
      `  • ${data.sideEffects || 'None'}\n` +
      (data.considerations ? `  • ${data.considerations}\n` : '')
    );
  }

  return sections.join('\n');
}

function formatSeverity(severity) {
  const sev = (severity || 'medium').toLowerCase();
  if (sev === 'critical' || sev === 'high') return chalk.bgRed.white.bold(` ${sev.toUpperCase()} `);
  if (sev === 'medium') return chalk.bgYellow.black.bold(` ${sev.toUpperCase()} `);
  return chalk.bgGreen.black.bold(` ${sev.toUpperCase()} `);
}
