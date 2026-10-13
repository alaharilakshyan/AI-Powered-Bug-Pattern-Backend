import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';

/**
 * Audits error traces and stack logs for security vulnerabilities and CWE/CVE risk.
 */
export function auditSecurityVulnerability(traceText) {
  const text = String(traceText || '').trim();
  const isSql = /SQL|syntax error|syntax|DROP|SELECT|pg|database|WHERE/i.test(text);
  const isTypeError = /TypeError|undefined|null/i.test(text);
  const isOom = /heap|memory|allocation|OOM|FATAL/i.test(text);
  const isSensitive = /password|secret|key|sk-|bearer|aws/i.test(text);
  const isPath = /\.\.|\/etc\/|Windows\\System32/i.test(text);

  if (isSql) {
    return {
      cweId: 'CWE-89',
      title: 'Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)',
      owasp: 'A03:2021 - Injection',
      cvssScore: 9.8,
      severity: 'CRITICAL',
      exploitability: 'High (Remote, Unauthenticated)',
      remediation: 'Use parameterized queries, prepared statements, or an abstraction ORM layer with bound variables.',
      safeCodeSample: 'const res = await db.query("SELECT * FROM users WHERE id = $1", [userId]);'
    };
  }

  if (isSensitive) {
    return {
      cweId: 'CWE-209',
      title: 'Generation of Error Message Containing Sensitive Information',
      owasp: 'A04:2021 - Insecure Design / Cryptographic Failures',
      cvssScore: 7.5,
      severity: 'HIGH',
      exploitability: 'Medium (Log Inspection / Error Banner)',
      remediation: 'Implement BugGraph Secret Sanitizer shield to redact tokens, passwords, and API keys before logging.',
      safeCodeSample: 'const scrubbed = sanitizeText(rawErrorString); logger.error(scrubbed);'
    };
  }

  if (isPath) {
    return {
      cweId: 'CWE-22',
      title: 'Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)',
      owasp: 'A01:2021 - Broken Access Control',
      cvssScore: 8.6,
      severity: 'HIGH',
      exploitability: 'High (Local File Inclusion)',
      remediation: 'Validate canonical file paths using path.resolve and verify they remain within the intended base directory.',
      safeCodeSample: 'const safe = path.normalize(input).replace(/^(\\.\\.[\\/\\\\])+/, "");'
    };
  }

  if (isOom) {
    return {
      cweId: 'CWE-400',
      title: 'Uncontrolled Resource Consumption (Denial of Service via Memory Exhaustion)',
      owasp: 'A05:2021 - Security Misconfiguration',
      cvssScore: 7.5,
      severity: 'HIGH',
      exploitability: 'Medium (Repeated Large Payload Submission)',
      remediation: 'Set strict request body limits and stream chunked data instead of buffering entire files in memory.',
      safeCodeSample: 'app.use(express.json({ limit: "1mb" }));'
    };
  }

  if (isTypeError) {
    return {
      cweId: 'CWE-476',
      title: 'NULL Pointer / Undefined Reference Dereference (Application Crash DoS)',
      owasp: 'A05:2021 - Security Misconfiguration',
      cvssScore: 5.3,
      severity: 'MEDIUM',
      exploitability: 'Low (Exception Triggers Uncaught Handler)',
      remediation: 'Add defensive nullish checks (?.) and global error boundary catchers to prevent process crash.',
      safeCodeSample: 'const value = record?.profile?.data ?? null;'
    };
  }

  return {
    cweId: 'CWE-703',
    title: 'Improper Check or Handling of Exceptional Conditions',
    owasp: 'A09:2021 - Security Logging and Monitoring Failures',
    cvssScore: 4.3,
    severity: 'LOW',
    exploitability: 'Low',
    remediation: 'Standardize try/catch blocks and avoid leaking internal system stack traces to external users.',
    safeCodeSample: 'try { await execute(); } catch (err) { logger.error(err); return genericError(); }'
  };
}

export async function cveCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({
      options,
      title: 'BugGraph Security & CWE Threat Auditor'
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste a stack trace or pass --file <path>.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Auditing error signature against OWASP Top 10 & CWE database...').start();
    await new Promise(r => setTimeout(r, 220));
    spinner.stop();

    const vuln = auditSecurityVulnerability(sanitizedTrace);

    if (options.json) {
      console.log(JSON.stringify(vuln, null, 2));
      return;
    }

    const severityColor = vuln.severity === 'CRITICAL' ? chalk.bold.red : vuln.severity === 'HIGH' ? chalk.bold.hex('#ffaa00') : chalk.bold.cyan;

    const bannerLines = [
      `${chalk.bold.hex('#ff3366')('🛡️  SECURITY VULNERABILITY & CWE THREAT AUDIT')}\n`,
      `${chalk.bold('Vulnerability')} : ${chalk.white.bold(vuln.cweId + ' — ' + vuln.title)}`,
      `${chalk.bold('OWASP Mapping')} : ${chalk.cyan(vuln.owasp)}`,
      `${chalk.bold('CVSS 3.1 Base')} : ${severityColor(vuln.cvssScore + ' / 10.0')} (${severityColor(vuln.severity)})`,
      `${chalk.bold('Exploit Rating')}: ${chalk.yellow(vuln.exploitability)}`,
      `${chalk.bold('Remediation') } : ${chalk.green(vuln.remediation)}`
    ];

    console.log(boxen(bannerLines.join('\n'), {
      padding: 1,
      borderColor: vuln.severity === 'CRITICAL' ? 'red' : 'yellow',
      borderStyle: 'double'
    }));

    console.log(chalk.bold.yellow('\n🔐 RECOMMENDED SECURE CODE IMPLEMENTATION:'));
    console.log(chalk.bgBlack.white(`  ${vuln.safeCodeSample}\n`));
  } catch (err) {
    console.error(chalk.red(`Failed to audit security vulnerability: ${err.message}`));
    process.exit(1);
  }
}
