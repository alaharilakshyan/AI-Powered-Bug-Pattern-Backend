import test from 'node:test';
import assert from 'node:assert';
import { sanitizeText } from '../src/sanitizer.js';

test('Sanitizer - Redacts OpenAI API keys', () => {
  const raw = 'Error uploading logs with sk-proj-1234567890abcdef1234567890abcdef';
  const clean = sanitizeText(raw);
  assert.strictEqual(clean.includes('sk-proj-'), false);
  assert.strictEqual(clean.includes('[REDACTED_SECRET]'), true);
});

test('Sanitizer - Redacts Google Gemini API keys', () => {
  const raw = 'Failed request key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6';
  const clean = sanitizeText(raw);
  assert.strictEqual(clean.includes('AIzaSy'), false);
  assert.strictEqual(clean.includes('[REDACTED_SECRET]'), true);
});

test('Sanitizer - Redacts Bearer and JWT tokens', () => {
  const raw = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const clean = sanitizeText(raw);
  assert.strictEqual(clean.includes('eyJhbGci'), false);
  assert.strictEqual(clean.includes('[REDACTED_SECRET]'), true);
});

test('Sanitizer - Redacts DB URI Connection strings', () => {
  const raw = 'Connecting to mongodb+srv://admin:SuperSecretPass123@cluster0.mongodb.net/dbname';
  const clean = sanitizeText(raw);
  assert.strictEqual(clean.includes('SuperSecretPass123'), false);
  assert.strictEqual(clean.includes('[REDACTED_PASS]'), true);
});
