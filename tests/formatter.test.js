import test from 'node:test';
import assert from 'node:assert';
import { formatSolveResponse, formatExplainResponse, formatFixResponse, printBanner } from '../src/ui/formatter.js';

test('Formatter - printBanner executes cleanly without error', () => {
  assert.doesNotThrow(() => {
    printBanner();
  });
});

test('Formatter - Renders AI Solve Response layout', () => {
  const mockPayload = {
    errorType: 'TypeError',
    severity: 'high',
    confidence: 0.95,
    summary: 'Cannot read properties of undefined',
    rootCause: 'State object uninitialized on render',
    solution: {
      description: 'Initialize state with empty array',
      code: 'const [items, setItems] = useState([]);'
    },
    optimization: {
      complexity: 'Time: O(N) | Space: O(1)',
      performance: 'Prevents crash loop'
    }
  };

  const output = formatSolveResponse(mockPayload);
  assert.strictEqual(output.includes('BUGGRAPH AI ERROR DIAGNOSIS'), true);
  assert.strictEqual(output.includes('Cannot read properties of undefined'), true);
  assert.strictEqual(output.includes('O(N)'), true);
});

test('Formatter - Renders AI Explain Response layout', () => {
  const mockPayload = {
    summary: 'Runtime Access Control Failure',
    meaning: 'The endpoint is missing user identity verification checks.',
    likelyCause: 'Missing auth middleware route wrapper.'
  };

  const output = formatExplainResponse(mockPayload);
  assert.strictEqual(output.includes('BUGGRAPH ERROR EXPLAINER'), true);
  assert.strictEqual(output.includes('Runtime Access Control Failure'), true);
});

test('Formatter - Renders AI Fix Response layout', () => {
  const mockPayload = {
    rootCause: 'Direct string interpolation in SQL query statement',
    fixDiff: '@@ -10,1 +10,1 @@\n-db.query("SELECT * FROM users WHERE name = " + input)\n+db.query("SELECT * FROM users WHERE name = $1", [input])',
    explanation: 'Replaced insecure string concatenation with parameterized SQL bindings.'
  };

  const output = formatFixResponse(mockPayload);
  assert.strictEqual(output.includes('CONCRETE CODE FIX'), true);
  assert.strictEqual(output.includes('SELECT * FROM users'), true);
});
