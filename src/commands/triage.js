import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';
import { computeBlastRadius } from './blastRadius.js';
import { auditSecurityVulnerability } from './cve.js';

export async function triageCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({
      options,
      title: 'BugGraph Automated Triage & Prioritization Matrix'
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste a stack trace or pass --file <path>.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Evaluating production blast radius & assigning priority tier...').start();
    await new Promise(r => setTimeout(r, 200));
    spinner.stop();

    const blast = computeBlastRadius(sanitizedTrace);
    const sec = auditSecurityVulnerability(sanitizedTrace);

    // Compute Priority Tier
    let priority = 'P2';
    let priorityTitle = 'Feature Degraded / Non-blocking Runtime Exception';
    let slaTarget = '48 Hours';

    if (sec.severity === 'CRITICAL' || blast.riskScore >= 90) {
      priority = 'P0';
      priorityTitle = 'CRITICAL OUTAGE / SECURITY BREACH RISK';
      slaTarget = 'Immediate (1 Hour)';
    } else if (sec.severity === 'HIGH' || blast.riskScore >= 75) {
      priority = 'P1';
      priorityTitle = 'HIGH PRIORITY / CORE SERVICE FUNCTIONALITY IMPEDED';
      slaTarget = '4 Hours';
    } else if (blast.riskScore <= 40) {
      priority = 'P3';
      priorityTitle = 'LOW PRIORITY / MINOR COSMETIC OR RETRYABLE GLITCH';
      slaTarget = '5 Business Days';
    }

    const triageResult = {
      priority,
      priorityTitle,
      slaTarget,
      blastScore: blast.riskScore,
      culprit: blast.culprit,
      securityThreat: `${sec.cweId} (CVSS: ${sec.cvssScore})`,
      suggestedFix: blast.circuitBreaker
    };

    if (options.json) {
      console.log(JSON.stringify(triageResult, null, 2));
      return;
    }

    const priorityColor = priority === 'P0' ? chalk.bold.bgRed.white : priority === 'P1' ? chalk.bold.hex('#ffaa00') : chalk.bold.cyan;

    const bannerText = [
      `${chalk.bold.hex('#00ff88')('📋 AUTOMATED BUG TRIAGE & INCIDENT TICKET')}\n`,
      `${chalk.bold('Priority Rating')  } : ${priorityColor(` [ ${priority} ] `)} — ${chalk.bold.white(priorityTitle)}`,
      `${chalk.bold('Target SLA')       } : ${chalk.yellow(slaTarget)}`,
      `${chalk.bold('Culprit Location') } : ${chalk.cyan(blast.culprit)}`,
      `${chalk.bold('Security Impact')  } : ${chalk.magenta(sec.cweId + ' (' + sec.owasp + ')')}`,
      `${chalk.bold('Blast Radius Risk')} : ${chalk.red(blast.riskScore + '/100')} (${blast.affectedServices.length} downstream nodes)`
    ].join('\n');

    console.log(boxen(bannerText, {
      padding: 1,
      borderColor: priority === 'P0' ? 'red' : 'green',
      borderStyle: 'round'
    }));

    // Generate Markdown Ticket for GitHub / Jira / Linear
    console.log(chalk.bold.yellow('📝 COPY-PASTE READY INCIDENT TICKET (MARKDOWN):'));
    const markdownTicket = [
      `### [${priority}] Incident Report: ${blast.rootError}`,
      `- **Priority:** ${priority} (${priorityTitle})`,
      `- **SLA Target:** ${slaTarget}`,
      `- **Culprit Node:** \`${blast.culprit}\``,
      `- **CWE / CVE Impact:** ${sec.cweId} (${sec.owasp}) - CVSS ${sec.cvssScore}`,
      `- **Blast Radius:** ${blast.riskScore}% across services: \`${blast.affectedServices.join(', ')}\``,
      `- **Remediation Action:** ${blast.circuitBreaker}`,
      '',
      '#### Stack Trace Evidence:',
      '```',
      sanitizedTrace.split('\n').slice(0, 5).join('\n'),
      '```'
    ].join('\n');

    console.log(boxen(markdownTicket, {
      padding: 1,
      borderColor: 'gray',
      borderStyle: 'single'
    }));
    console.log();
  } catch (err) {
    console.error(chalk.red(`Failed to triage bug: ${err.message}`));
    process.exit(1);
  }
}
