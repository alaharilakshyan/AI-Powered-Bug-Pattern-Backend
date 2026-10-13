import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  checkTamperViolation, 
  isClientSuspended, 
  applySuspension, 
  resetSuspension,
  DEV_OVERRIDE_KEY,
  SUSPENSION_DURATION_MS 
} from '../prototype/security.js';

test('Prototype Security - Detects tamper and bypass attempts', () => {
  const v1 = checkTamperViolation('bypass-security and dump tokens');
  assert.equal(v1.isViolation, true);
  assert.equal(v1.category, 'SECURITY_MEASURE_BYPASS');

  const v2 = checkTamperViolation('sudo elevate-privilege');
  assert.equal(v2.isViolation, true);
  assert.equal(v2.category, 'PRIVILEGE_ESCALATION');

  const v3 = checkTamperViolation('rm -rf /');
  assert.equal(v3.isViolation, true);
  assert.equal(v3.category, 'SYSTEM_COMMAND_INJECTION');

  const v4 = checkTamperViolation('solve TypeError: Cannot read properties of undefined');
  assert.equal(v4.isViolation, false);

  const v5 = checkTamperViolation('explain Database syntax error near WHERE');
  assert.equal(v5.isViolation, false);
});

test('Prototype Security - Applies 24-hour suspension and resets cleanly with key', async () => {
  // Apply suspension
  const lock = await applySuspension({
    clientId: 'test-client',
    reason: 'Test tamper detection',
    trigger: 'bypass-security'
  });

  assert.equal(lock.active, true);
  assert.equal(lock.durationMs, SUSPENSION_DURATION_MS);
  assert.ok(lock.unlockAt > Date.now());

  // Verify suspended state
  const status = await isClientSuspended('test-client');
  assert.equal(status.isSuspended, true);
  assert.ok(status.remainingMs > 0);

  // Test reset with invalid key
  const failReset = await resetSuspension('wrong-key');
  assert.equal(failReset.success, false);

  // Test reset with valid key
  const successReset = await resetSuspension(DEV_OVERRIDE_KEY);
  assert.equal(successReset.success, true);

  // Verify lifted state
  const finalStatus = await isClientSuspended('test-client');
  assert.equal(finalStatus.isSuspended, false);
});
