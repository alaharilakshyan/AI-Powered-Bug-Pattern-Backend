import test from 'node:test';
import assert from 'node:assert';
import { getConfig, setToken, setEndpoint, clearConfig } from '../src/config.js';

test('Config - Stores and retrieves configuration values', () => {
  clearConfig();

  setToken('bg_token_test_12345');
  setEndpoint('http://localhost:4000');

  const cfg = getConfig();
  assert.strictEqual(cfg.token, 'bg_token_test_12345');
  assert.strictEqual(cfg.endpoint, 'http://localhost:4000');
});
