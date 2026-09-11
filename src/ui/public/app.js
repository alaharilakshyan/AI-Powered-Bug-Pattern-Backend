// ==========================================================================
// BugGraph AI Workstation — Window Utility Client Logic
// ==========================================================================

const API_BASE = window.location.origin;

// Sample Presets
const PRESETS = {
  typeerror: `TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (src/components/UserList.jsx:42:18)
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork (node_modules/react-dom/cjs/react-dom.development.js:19049:16)`,

  sqli: `Database Error: syntax error at or near "DROP"
    Query: SELECT * FROM accounts WHERE username = 'admin' OR '1'='1' AND role = 'user'
    at Client._query (node_modules/pg/lib/client.js:527:17)
    at AuthService.authenticate (src/services/auth.js:89:22)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,

  reference: `ReferenceError: activeSessionId is not defined
    at debugCommand (src/commands/debug.js:12:35)
    at async runInteractiveMenu (bin/buggraph.js:135:9)
    at async file:///c:/VOLUME%20D/AI-Powered-Bug-Pattern-Backend/bin/buggraph.js:160:3`
};

let currentActiveSessionId = null;

// ==========================================================================
// TOAST SYSTEM
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================================================
// ENGINE STATUS & CONFIG
// ==========================================================================
async function fetchEngineStatus() {
  const pill = document.getElementById('connectionPill');
  const text = document.getElementById('connectionText');

  pill.className = 'status-pill checking';
  text.textContent = 'Checking Engine...';

  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();

    if (data.mode && data.mode.includes('Live')) {
      pill.className = 'status-pill online';
      text.textContent = `● Connected Live (${data.endpoint})`;
    } else {
      pill.className = 'status-pill standalone';
      text.textContent = `● Standalone Local AI Engine Active`;
    }
  } catch (err) {
    pill.className = 'status-pill standalone';
    text.textContent = `● Standalone Local Mode`;
  }
}

async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    const data = await res.json();
    if (data.endpoint) {
      document.getElementById('configEndpoint').value = data.endpoint;
    }
    if (data.token) {
      document.getElementById('configToken').value = data.token;
    }
    if (data.activeSessionId) {
      currentActiveSessionId = data.activeSessionId;
      document.getElementById('activeSessionIdText').textContent = currentActiveSessionId;
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// ==========================================================================
// TAB NAVIGATION
// ==========================================================================
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(`panel${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

// ==========================================================================
// 1. AI ERROR SOLVER
// ==========================================================================
function initSolveModule() {
  const traceInput = document.getElementById('solveTraceInput');
  const langSelect = document.getElementById('solveLanguage');
  const fwSelect = document.getElementById('solveFramework');
  const submitBtn = document.getElementById('submitSolveBtn');
  const clearBtn = document.getElementById('clearSolveBtn');
  const placeholder = document.getElementById('solvePlaceholder');
  const results = document.getElementById('solveResults');

  // Quick preset buttons
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const presetKey = chip.getAttribute('data-preset');
      if (PRESETS[presetKey]) {
        traceInput.value = PRESETS[presetKey];
        if (presetKey === 'typeerror') {
          langSelect.value = 'javascript';
          fwSelect.value = 'react';
        } else if (presetKey === 'sqli') {
          langSelect.value = 'javascript';
          fwSelect.value = 'node';
        }
        showToast(`Loaded ${chip.textContent} preset!`);
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    traceInput.value = '';
    placeholder.hidden = false;
    results.hidden = true;
  });

  // Ctrl + Enter shortcut
  traceInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      submitBtn.click();
    }
  });

  submitBtn.addEventListener('click', async () => {
    const errorText = traceInput.value.trim();
    if (!errorText) {
      showToast('Please paste a stack trace or compiler error first.', 'error');
      traceInput.focus();
      return;
    }

    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    spinner.hidden = false;
    btnText.textContent = 'Analyzing Knowledge Graph...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorText,
          stackTrace: errorText,
          language: langSelect.value,
          framework: fwSelect.value
        })
      });

      const data = await res.json();
      renderSolveResults(data);
      placeholder.hidden = true;
      results.hidden = false;
      showToast('AI Error Diagnosis complete!');
    } catch (err) {
      showToast(`Solve error: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = '🔍 Analyze & Solve Error';
      submitBtn.disabled = false;
    }
  });

  // Copy code fix button
  document.getElementById('copySolveFixBtn').addEventListener('click', () => {
    const code = document.getElementById('solveFixCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
      showToast('Code fix copied to clipboard!');
    });
  });
}

function renderSolveResults(data) {
  document.getElementById('solveErrorType').textContent = data.errorType || 'Runtime Exception';
  
  const sevEl = document.getElementById('solveSeverity');
  sevEl.textContent = (data.severity || 'MEDIUM').toUpperCase();
  if (data.severity === 'critical') {
    sevEl.style.color = '#ef4444';
  } else if (data.severity === 'high') {
    sevEl.style.color = '#f97316';
  } else {
    sevEl.style.color = '#facc15';
  }

  const confidencePct = Math.round((data.confidence || 0.95) * 100);
  document.getElementById('solveConfidence').textContent = `${confidencePct}% Confidence`;
  document.getElementById('solveSummaryText').textContent = data.summary || 'Compiler or runtime error detected.';
  document.getElementById('solveRootCauseText').textContent = data.rootCause || 'Target payload failed runtime safety invariant.';

  // Patterns
  const patternsContainer = document.getElementById('solvePatternsList');
  patternsContainer.innerHTML = '';
  const patterns = data.relatedPatterns || ['Standard Defensive Guard'];
  patterns.forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'pattern-tag';
    tag.textContent = p;
    patternsContainer.appendChild(tag);
  });

  // Solution
  const fixDesc = data.solution?.description || 'Apply defensive guard fix.';
  const fixCode = data.solution?.code || '// Safe replacement code';
  document.getElementById('solveFixDesc').textContent = fixDesc;
  document.getElementById('solveFixCode').textContent = fixCode;

  // Optimization
  const opt = data.optimization || {};
  document.getElementById('solveOptComplexity').textContent = opt.complexity || 'Time: O(N) | Space: O(1)';
  document.getElementById('solveOptPerf').textContent = opt.performance || 'Prevents runtime crashes';
  document.getElementById('solveOptSec').textContent = opt.security || 'Guarded parameter validation';
  document.getElementById('solveOptMaint').textContent = opt.maintainability || 'Production-grade safety pattern';
}

// ==========================================================================
// 2. ERROR EXPLAINER
// ==========================================================================
function initExplainModule() {
  const input = document.getElementById('explainInput');
  const submitBtn = document.getElementById('submitExplainBtn');
  const clearBtn = document.getElementById('clearExplainBtn');
  const presetBtn = document.getElementById('explainPresetBtn');
  const placeholder = document.getElementById('explainPlaceholder');
  const results = document.getElementById('explainResults');

  presetBtn.addEventListener('click', () => {
    input.value = PRESETS.typeerror;
    showToast('Loaded sample error!');
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    placeholder.hidden = false;
    results.hidden = true;
  });

  submitBtn.addEventListener('click', async () => {
    const errorText = input.value.trim();
    if (!errorText) {
      showToast('Please paste an error message first.', 'error');
      input.focus();
      return;
    }

    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    spinner.hidden = false;
    btnText.textContent = 'Generating explanation...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorText, message: errorText })
      });

      const data = await res.json();
      renderExplainResults(data);
      placeholder.hidden = true;
      results.hidden = false;
      showToast('Error explanation generated!');
    } catch (err) {
      showToast(`Explain error: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = '📖 Explain Error';
      submitBtn.disabled = false;
    }
  });
}

function renderExplainResults(data) {
  document.getElementById('explainSummaryText').textContent = data.summary || data.meaning || 'Error explanation.';
  document.getElementById('explainMeaningText').textContent = data.meaning || 'An operation was attempted on an invalid state reference.';
  document.getElementById('explainLikelyCauseText').textContent = data.likelyCause || 'Asynchronous state or missing guard check.';

  // Concepts
  const conceptsList = document.getElementById('explainConceptsList');
  conceptsList.innerHTML = '';
  const concepts = data.concepts || ['Defensive Programming', 'Null Safety', 'Error Handling'];
  concepts.forEach(c => {
    const chip = document.createElement('span');
    chip.className = 'concept-tag';
    chip.textContent = c;
    conceptsList.appendChild(chip);
  });

  // Next steps
  const stepsList = document.getElementById('explainStepsList');
  stepsList.innerHTML = '';
  const steps = data.nextSteps || [
    'Inspect the line referenced in stack trace for uninitialized values.',
    'Add fallback defaults or optional chaining.',
    'Verify that async promises resolve before rendering.'
  ];
  steps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    stepsList.appendChild(li);
  });
}

// ==========================================================================
// 3. CODE FIX PATCH GENERATOR
// ==========================================================================
function initFixModule() {
  const input = document.getElementById('fixInput');
  const submitBtn = document.getElementById('submitFixBtn');
  const clearBtn = document.getElementById('clearFixBtn');
  const presetBtn = document.getElementById('fixPresetBtn');
  const placeholder = document.getElementById('fixPlaceholder');
  const results = document.getElementById('fixResults');

  presetBtn.addEventListener('click', () => {
    input.value = PRESETS.sqli;
    showToast('Loaded sample defect!');
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    placeholder.hidden = false;
    results.hidden = true;
  });

  submitBtn.addEventListener('click', async () => {
    const errorText = input.value.trim();
    if (!errorText) {
      showToast('Please paste a bug trace or code context first.', 'error');
      input.focus();
      return;
    }

    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    spinner.hidden = false;
    btnText.textContent = 'Generating patch...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorText, stackTrace: errorText })
      });

      const data = await res.json();
      renderFixResults(data);
      placeholder.hidden = true;
      results.hidden = false;
      showToast('Code fix patch created!');
    } catch (err) {
      showToast(`Fix error: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = '🛠️ Generate Code Fix';
      submitBtn.disabled = false;
    }
  });

  document.getElementById('copyFixDiffBtn').addEventListener('click', () => {
    const diffText = document.getElementById('fixDiffViewer').innerText;
    navigator.clipboard.writeText(diffText).then(() => {
      showToast('Diff patch copied to clipboard!');
    });
  });
}

function renderFixResults(data) {
  const diffViewer = document.getElementById('fixDiffViewer');
  diffViewer.innerHTML = '';

  const rawDiff = data.fixDiff || '@@ -1,1 +1,1 @@\n-const unsafe = input;\n+const safe = sanitize(input);';
  const lines = rawDiff.split('\n');

  lines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'diff-line';
    if (line.startsWith('@@')) {
      div.classList.add('header');
    } else if (line.startsWith('-')) {
      div.classList.add('del');
    } else if (line.startsWith('+')) {
      div.classList.add('add');
    }
    div.textContent = line;
    diffViewer.appendChild(div);
  });

  document.getElementById('fixExplanationText').textContent = data.explanation || 'Replaced direct unsafe execution with guarded implementation.';
  
  const sideEffects = data.sideEffects || 'None detected.';
  const considerations = data.considerations ? ` ${data.considerations}` : '';
  document.getElementById('fixSideEffectsText').textContent = sideEffects + considerations;
}

// ==========================================================================
// 4. INTERACTIVE AI DEBUGGER CHAT
// ==========================================================================
function initDebugChatModule() {
  const chatHistory = document.getElementById('chatHistory');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  const newSessionBtn = document.getElementById('newSessionBtn');

  newSessionBtn.addEventListener('click', () => {
    currentActiveSessionId = `session_${Math.random().toString(36).substring(2, 9)}`;
    document.getElementById('activeSessionIdText').textContent = currentActiveSessionId;
    chatHistory.innerHTML = `
      <div class="chat-bubble ai-bubble">
        <div class="bubble-header">
          <span class="bot-icon">🤖</span>
          <span class="bot-name">BugGraph AI Debugger</span>
          <span class="bubble-time">Just now</span>
        </div>
        <div class="bubble-content">
          New session started (${currentActiveSessionId}). Paste an error trace or describe the bug you are investigating.
        </div>
      </div>
    `;
    showToast('Started new debugging session');
  });

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.textContent;
      chatInput.focus();
    });
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  sendBtn.addEventListener('click', async () => {
    const msg = chatInput.value.trim();
    if (!msg) return;

    chatInput.value = '';

    // Append user bubble
    appendChatBubble('user', msg);

    // AI thinking bubble placeholder
    const thinkingId = 'thinking_' + Date.now();
    appendChatBubble('ai', 'Thinking & querying knowledge graph...', thinkingId);

    try {
      const res = await fetch(`${API_BASE}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentActiveSessionId,
          message: msg,
          environment: 'window-utility'
        })
      });

      const data = await res.json();
      currentActiveSessionId = data.sessionId || currentActiveSessionId;
      document.getElementById('activeSessionIdText').textContent = currentActiveSessionId;

      // Replace thinking placeholder
      const thinkingEl = document.getElementById(thinkingId);
      if (thinkingEl) {
        thinkingEl.querySelector('.bubble-content').textContent = data.reply || data.summary || 'Context received.';
      }
    } catch (err) {
      const thinkingEl = document.getElementById(thinkingId);
      if (thinkingEl) {
        thinkingEl.querySelector('.bubble-content').textContent = `Session error: ${err.message}`;
      }
    }
  });
}

function appendChatBubble(sender, text, customId = null) {
  const chatHistory = document.getElementById('chatHistory');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'ai-bubble'}`;
  if (customId) bubble.id = customId;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.innerHTML = `
    <div class="bubble-header">
      <span class="bot-icon">${sender === 'user' ? '👤' : '🤖'}</span>
      <span class="bot-name">${sender === 'user' ? 'Developer' : 'BugGraph AI'}</span>
      <span class="bubble-time">${now}</span>
    </div>
    <div class="bubble-content">${escapeHtml(text)}</div>
  `;

  chatHistory.appendChild(bubble);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==========================================================================
// 5. BUG INGESTION FORM
// ==========================================================================
function initIngestModule() {
  const form = document.getElementById('ingestBugForm');
  const submitBtn = document.getElementById('submitBugBtn');
  const successCard = document.getElementById('ingestSuccessCard');
  const successMsg = document.getElementById('ingestSuccessMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('bugTitle').value.trim();
    const severity = document.getElementById('bugSeverity').value;
    const component = document.getElementById('bugComponent').value.trim();
    const tags = document.getElementById('bugTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const description = document.getElementById('bugDesc').value.trim();
    const stackTrace = document.getElementById('bugTrace').value.trim();

    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    spinner.hidden = false;
    btnText.textContent = 'Submitting to Ledger...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          severity,
          component,
          tags,
          description,
          stackTrace,
          error: stackTrace
        })
      });

      const data = await res.json();
      const bugId = data.data?.id || data.id || 'bug_recorded';

      successMsg.textContent = `Recorded: [${bugId}] "${title}" (Severity: ${severity.toUpperCase()}, Component: ${component})`;
      successCard.hidden = false;
      showToast(`Bug ${bugId} ingested successfully!`);
      form.reset();
    } catch (err) {
      showToast(`Ingestion failed: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = '📥 Submit to BugGraph Ledger';
      submitBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 6. SETTINGS & CONFIG
// ==========================================================================
function initSettingsModule() {
  const form = document.getElementById('configForm');
  const testBtn = document.getElementById('testConnBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = document.getElementById('configEndpoint').value.trim();
    const token = document.getElementById('configToken').value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, token: token || null })
      });

      const data = await res.json();
      showToast('Configuration saved successfully!');
      fetchEngineStatus();
    } catch (err) {
      showToast(`Failed to save config: ${err.message}`, 'error');
    }
  });

  testBtn.addEventListener('click', async () => {
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    try {
      await fetchEngineStatus();
      showToast('Connection test completed!');
    } finally {
      testBtn.textContent = 'Test Connection';
      testBtn.disabled = false;
    }
  });
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSolveModule();
  initExplainModule();
  initFixModule();
  initDebugChatModule();
  initIngestModule();
  initSettingsModule();

  document.getElementById('refreshStatusBtn').addEventListener('click', fetchEngineStatus);

  fetchEngineStatus();
  loadConfig();
});
