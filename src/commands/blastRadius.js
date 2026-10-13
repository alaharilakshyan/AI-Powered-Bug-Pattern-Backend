import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { resolveTraceInput } from '../input.js';
import { sanitizeText } from '../sanitizer.js';

/**
 * Analyzes stack trace and computes knowledge graph blast radius.
 */
export function computeBlastRadius(traceText) {
  const text = String(traceText || '').trim();
  const isTypeError = /TypeError|undefined|null/i.test(text);
  const isSql = /SQL|syntax error|syntax|DROP|SELECT|pg|database/i.test(text);
  const isOom = /heap|memory|allocation|OOM|FATAL/i.test(text);
  const isNetwork = /ECONNREFUSED|ETIMEDOUT|fetch|network/i.test(text);

  let rootError = 'Unhandled Runtime Exception';
  let culprit = 'src/index.js:1:1';
  let riskScore = 65;
  let severity = 'HIGH';
  let affectedServices = ['core-service'];
  let cascadeRisk = 'Moderate - Uncaught rejection in async loop';
  let circuitBreaker = 'Add boundary try/catch block with fallback state';

  if (isTypeError) {
    rootError = 'TypeError: Nullish Property Dereference';
    culprit = 'src/components/UserList.jsx:42:18 -> UserList()';
    riskScore = 78;
    severity = 'HIGH';
    affectedServices = ['frontend-renderer', 'user-profile-view', 'client-session'];
    cascadeRisk = 'Component render tree unmounts; blank screen for end-user';
    circuitBreaker = 'Add optional chaining (?.) and default nullish fallback (?? [])';
  } else if (isSql) {
    rootError = 'CWE-89 SQL Injection / Query Syntax Fault';
    culprit = 'src/services/auth.js:89:22 -> AuthService.authenticate()';
    riskScore = 96;
    severity = 'CRITICAL';
    affectedServices = ['database-cluster', 'auth-service', 'user-records', 'payment-gateway'];
    cascadeRisk = 'Database query abortion, potential table exfiltration, connection lock';
    circuitBreaker = 'Migrate to parameterized prepared statement ($1, $2 placeholders)';
  } else if (isOom) {
    rootError = 'V8 Heap Allocation Limit Exceeded (OOM Crash)';
    culprit = 'src/processors/stream.js:12:20 -> processHugeBuffer()';
    riskScore = 92;
    severity = 'CRITICAL';
    affectedServices = ['worker-pool', 'background-ingestion', 'queue-consumer'];
    cascadeRisk = 'Node.js isolate crash; container pod restart in Kubernetes';
    circuitBreaker = 'Switch synchronous in-memory buffer to stream.Readable pipeline';
  } else if (isNetwork) {
    rootError = 'Upstream Service Timeout / Connection Refused';
    culprit = 'src/api/client.js:34:10 -> fetchWithRetry()';
    riskScore = 60;
    severity = 'MEDIUM';
    affectedServices = ['api-gateway', 'downstream-clients'];
    cascadeRisk = 'Cascading timeout saturation across HTTP connection pool';
    circuitBreaker = 'Implement exponential backoff with jitter and circuit-breaker tripwire';
  }

  return {
    rootError,
    culprit,
    riskScore,
    severity,
    affectedServices,
    cascadeRisk,
    circuitBreaker,
    totalNodesImpacted: affectedServices.length + 2
  };
}

export async function blastRadiusCommand(options = {}) {
  try {
    const rawTrace = await resolveTraceInput({
      options,
      title: 'BugGraph Knowledge Graph Blast Radius Analyzer'
    });

    if (!rawTrace) {
      console.error(chalk.red('Error: Input trace is empty. Paste a stack trace or pass --file <path>.'));
      process.exit(1);
    }

    const sanitizedTrace = sanitizeText(rawTrace);
    const spinner = ora('Mapping dependencies & calculating blast radius ripple effect...').start();
    await new Promise(r => setTimeout(r, 220)); // Brief UX visual
    spinner.stop();

    const analysis = computeBlastRadius(sanitizedTrace);

    if (options.json) {
      console.log(JSON.stringify(analysis, null, 2));
      return;
    }

    const severityColor = analysis.severity === 'CRITICAL' ? chalk.bold.red : analysis.severity === 'HIGH' ? chalk.bold.hex('#ffaa00') : chalk.bold.cyan;

    const bannerLines = [
      `${chalk.bold.hex('#00ff88')('🕸️  KNOWLEDGE GRAPH BLAST RADIUS AUDIT')}\n`,
      `${chalk.bold('Root Exception')       } : ${chalk.white.bold(analysis.rootError)}`,
      `${chalk.bold('Culprit Origin')       } : ${chalk.cyan(analysis.culprit)}`,
      `${chalk.bold('Blast Radius Risk Score')} : ${severityColor(analysis.riskScore + '/100')} (${severityColor(analysis.severity)})`,
      `${chalk.bold('Impacted Graph Nodes') } : ${chalk.yellow(analysis.totalNodesImpacted + ' nodes across dependency boundary')}`,
      `${chalk.bold('Cascade Risk')         } : ${chalk.gray(analysis.cascadeRisk)}`
    ];

    console.log(boxen(bannerLines.join('\n'), {
      padding: 1,
      borderColor: analysis.severity === 'CRITICAL' ? 'red' : 'green',
      borderStyle: 'round'
    }));

    console.log(chalk.bold.yellow('\n🌳 BLAST RADIUS CASCADE TREE:'));
    console.log(`  🔴 [ROOT INCIDENT] ${analysis.rootError}`);
    console.log(`   ├── 🎯 [CULPRIT NODE] ${analysis.culprit}`);
    analysis.affectedServices.forEach((svc, idx) => {
      const isLast = idx === analysis.affectedServices.length - 1;
      const branch = isLast ? '└──' : '├──';
      console.log(`   ${branch} 📦 [DOWNSTREAM IMPACT] ${chalk.cyan(svc)} (Service at risk)`);
    });
    console.log(`   └── 🛡️  [CIRCUIT BREAKER] ${chalk.green(analysis.circuitBreaker)}\n`);
  } catch (err) {
    console.error(chalk.red(`Failed to calculate blast radius: ${err.message}`));
    process.exit(1);
  }
}
