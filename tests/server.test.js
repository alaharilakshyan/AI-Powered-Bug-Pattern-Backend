import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { startWorkstationServer } from '../src/ui/server.js';

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(parsed, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('Workstation Server - Starts and serves static files and APIs', async (t) => {
  const workstation = await startWorkstationServer({ port: 4600 });
  assert.ok(workstation.port >= 4600);
  assert.ok(workstation.url.startsWith('http://127.0.0.1:'));

  t.after(async () => {
    await workstation.close();
  });

  // Test 1: Root serves index.html
  const htmlRes = await makeRequest(`${workstation.url}/`);
  assert.strictEqual(htmlRes.statusCode, 200);
  assert.ok(htmlRes.headers['content-type'].includes('text/html'));
  assert.ok(htmlRes.body.includes('BUGGRAPH'));
  assert.ok(htmlRes.body.includes('WINDOW UTILITY TOOL'));

  // Test 2: Serves styles.css
  const cssRes = await makeRequest(`${workstation.url}/styles.css`);
  assert.strictEqual(cssRes.statusCode, 200);
  assert.ok(cssRes.headers['content-type'].includes('text/css'));
  assert.ok(cssRes.body.includes('--cyan-primary'));

  // Test 3: Serves app.js
  const jsRes = await makeRequest(`${workstation.url}/app.js`);
  assert.strictEqual(jsRes.statusCode, 200);
  assert.ok(jsRes.headers['content-type'].includes('javascript'));
  assert.ok(jsRes.body.includes('BugGraph AI Workstation'));

  // Test 4: GET /api/status
  const statusRes = await makeRequest(`${workstation.url}/api/status`);
  assert.strictEqual(statusRes.statusCode, 200);
  const statusData = JSON.parse(statusRes.body);
  assert.strictEqual(statusData.online, true);
  assert.ok(statusData.mode);

  // Test 5: POST /api/solve
  const solveRes = await makeRequest(`${workstation.url}/api/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    error: 'TypeError: Cannot read properties of undefined (reading "map")'
  });
  assert.strictEqual(solveRes.statusCode, 200);
  const solveData = JSON.parse(solveRes.body);
  assert.strictEqual(solveData.success, true);
  assert.strictEqual(solveData.errorType, 'TypeError');
  assert.ok(solveData.solution);

  // Test 6: POST /api/explain
  const explainRes = await makeRequest(`${workstation.url}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    error: 'ReferenceError: x is not defined'
  });
  assert.strictEqual(explainRes.statusCode, 200);
  const explainData = JSON.parse(explainRes.body);
  assert.strictEqual(explainData.success, true);
  assert.ok(explainData.summary);

  // Test 7: POST /api/fix
  const fixRes = await makeRequest(`${workstation.url}/api/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    error: 'TypeError: state is null'
  });
  assert.strictEqual(fixRes.statusCode, 200);
  const fixData = JSON.parse(fixRes.body);
  assert.strictEqual(fixData.success, true);
  assert.ok(fixData.fixDiff);
});
