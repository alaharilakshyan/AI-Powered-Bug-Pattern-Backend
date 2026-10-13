import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBlastRadius } from '../src/commands/blastRadius.js';
import { computeSimilarityCluster } from '../src/commands/similarity.js';
import { auditSecurityVulnerability } from '../src/commands/cve.js';
import { analyzeComplexity } from '../src/commands/benchmark.js';
import { 
  checkTamperViolation, 
  isClientSuspended, 
  applySuspension, 
  resetSuspension, 
  DEV_OVERRIDE_KEY 
} from '../src/security.js';

test('Commands - Blast Radius calculates risk score and impacted nodes', () => {
  const sampleTrace = "TypeError: Cannot read properties of undefined (reading 'map')";
  const result = computeBlastRadius(sampleTrace);

  assert.ok(result.riskScore > 50, 'Risk score should be elevated for TypeError');
  assert.equal(result.severity, 'HIGH');
  assert.ok(result.affectedServices.length >= 2, 'Should detect multiple downstream services');
  assert.ok(result.circuitBreaker.includes('optional chaining'), 'Circuit breaker should advise optional chaining');
});

test('Commands - Similarity Cluster identifies pattern fingerprint', () => {
  const sampleSql = "Database Error: syntax error at or near DROP";
  const cluster = computeSimilarityCluster(sampleSql);

  assert.ok(cluster.similarityPercent > 90, 'Similarity percentage should exceed 90%');
  assert.ok(cluster.clusterName.includes('Raw String Interpolation'));
  assert.ok(cluster.verifiedFixPattern.includes('Parameterized SQL'));
});

test('Commands - Security Threat Auditor identifies CWE and OWASP mappings', () => {
  const sampleSql = "SELECT * FROM accounts WHERE id = '1' OR '1'='1'";
  const vuln = auditSecurityVulnerability(sampleSql);

  assert.equal(vuln.cweId, 'CWE-89');
  assert.equal(vuln.severity, 'CRITICAL');
  assert.equal(vuln.cvssScore, 9.8);
  assert.ok(vuln.remediation.includes('parameterized queries'));
});

test('Commands - Algorithmic Complexity evaluates O(N) vs O(1)', () => {
  const sampleOom = "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory";
  const metrics = analyzeComplexity(sampleOom);

  assert.ok(metrics.currentSpaceComplexity.includes('O(N)'));
  assert.ok(metrics.optimizedSpaceComplexity.includes('O(1)'));
  assert.ok(metrics.optimizedPattern.includes('Streaming Pipeline'));
});

test('Security - Core security tripwires and 24-hour suspension cycle', async () => {
  const violation = checkTamperViolation('sudo rm -rf /');
  assert.equal(violation.isViolation, true);
  assert.equal(violation.category, 'PRIVILEGE_ESCALATION');

  const lock = await applySuspension({
    clientId: 'test-client',
    reason: 'Automated test violation',
    trigger: 'sudo rm -rf /'
  });

  assert.ok(lock.incidentId.startsWith('SEC-'));
  assert.equal(lock.active, true);

  const suspendedStatus = await isClientSuspended('test-client');
  assert.equal(suspendedStatus.isSuspended, true);

  // Test emergency reset
  const badReset = await resetSuspension('WRONG_KEY');
  assert.equal(badReset.success, false);

  const goodReset = await resetSuspension(DEV_OVERRIDE_KEY);
  assert.equal(goodReset.success, true);

  const clearedStatus = await isClientSuspended('test-client');
  assert.equal(clearedStatus.isSuspended, false);
});
