// ==========================================================================
// BugGraph AI Workstation — Window Utility Client Logic
// Architecture: Unified Investigation Workbench, Chat, Ledger, Settings
// ==========================================================================

const API_BASE = window.location.origin;

// Sample Presets for Quick Testing
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
let lastDiagnosedResult = null;
let lastDiagnosedTrace = '';

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// ==========================================================================
// NAVIGATION SYSTEM
// ==========================================================================
function switchToTab(targetTab) {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === targetTab) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`panel${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }
}

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchToTab(targetTab);
    });
  });
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
      text.textContent = `Live Backend (${data.endpoint})`;
    } else {
      pill.className = 'status-pill standalone';
      text.textContent = `Standalone Local Engine`;
    }
  } catch (err) {
    pill.className = 'status-pill standalone';
    text.textContent = `Standalone Local Mode`;
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
// 1. UNIFIED AI ERROR SOLVER
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
        } else if (presetKey === 'reference') {
          langSelect.value = 'javascript';
          fwSelect.value = 'node';
        }
        showToast(`Loaded ${chip.textContent} preset`);
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    traceInput.value = '';
    placeholder.hidden = false;
    results.hidden = true;
    lastDiagnosedResult = null;
    lastDiagnosedTrace = '';
    traceInput.focus();
  });

  // Ctrl + Enter shortcut
  traceInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      submitBtn.click();
    }
  });

  // View segment switcher (Root Cause | Code Fix & Diff | Plain Explainer)
  const segmentBtns = document.querySelectorAll('.segment-btn');
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.getAttribute('data-view');
      document.querySelectorAll('.view-segment').forEach(seg => seg.classList.remove('active'));

      if (view === 'rootcause') {
        document.getElementById('viewRootCause').classList.add('active');
      } else if (view === 'patch') {
        document.getElementById('viewPatch').classList.add('active');
      } else if (view === 'explainer') {
        document.getElementById('viewExplainer').classList.add('active');
      }
    });
  });

  submitBtn.addEventListener('click', async () => {
    const errorText = traceInput.value.trim();
    if (!errorText) {
      showToast('Please paste a stack trace or error log first.', 'error');
      traceInput.focus();
      return;
    }

    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    spinner.hidden = false;
    btnText.textContent = 'Analyzing Graph...';
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
      lastDiagnosedResult = data;
      lastDiagnosedTrace = errorText;

      renderUnifiedSolveResults(data);
      placeholder.hidden = true;
      results.hidden = false;
      showToast('Error diagnosed successfully!');
    } catch (err) {
      showToast(`Solve error: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = 'Analyze & Solve Error';
      submitBtn.disabled = false;
    }
  });

  // Copy buttons
  document.getElementById('copySolveFixBtn').addEventListener('click', () => {
    const code = document.getElementById('solveFixCode').textContent;
    copyTextToClipboard(code, 'Code fix copied to clipboard!');
  });

  document.getElementById('copySolveCodeOnlyBtn').addEventListener('click', () => {
    const code = document.getElementById('solveFixCode').textContent;
    copyTextToClipboard(code, 'Code fix copied to clipboard!');
  });

  document.getElementById('copySolveDiffBtn').addEventListener('click', () => {
    const diff = document.getElementById('solveDiffViewer').innerText;
    copyTextToClipboard(diff, 'Diff patch copied to clipboard!');
  });

  // 1-Click: Escalate to Debug Chat
  document.getElementById('escalateToChatBtn').addEventListener('click', () => {
    if (!lastDiagnosedResult) return;
    switchToTab('debug');

    const chatInput = document.getElementById('chatInput');
    const escalationPrompt = `I am debugging this error:\n\`\`\`\n${lastDiagnosedTrace}\n\`\`\`\nDiagnosis: ${lastDiagnosedResult.summary}\nRoot cause: ${lastDiagnosedResult.rootCause}\nCan you walk me through the fix step-by-step?`;
    chatInput.value = escalationPrompt;
    chatInput.focus();
    showToast('Transferred error diagnosis into Debug Chat!');
  });

  // 1-Click: Ingest into BugGraph Ledger
  document.getElementById('ingestFromSolveBtn').addEventListener('click', () => {
    if (!lastDiagnosedResult) return;
    switchToTab('log');

    document.getElementById('bugTitle').value = `[${lastDiagnosedResult.errorType || 'Error'}] ${lastDiagnosedResult.summary || 'Incident'}`;
    document.getElementById('bugSeverity').value = (lastDiagnosedResult.severity || 'medium').toLowerCase();
    document.getElementById('bugComponent').value = lastDiagnosedResult.framework !== 'auto-detect' ? lastDiagnosedResult.framework : 'workstation';
    document.getElementById('bugTags').value = (lastDiagnosedResult.relatedPatterns || []).join(', ');
    document.getElementById('bugDesc').value = lastDiagnosedResult.rootCause || '';
    document.getElementById('bugTrace').value = lastDiagnosedTrace;

    showToast('Pre-filled bug report in Ledger form. Review and submit!');
  });
}

function renderUnifiedSolveResults(data) {
  // Diagnosis Header
  document.getElementById('solveErrorType').textContent = data.errorType || 'Runtime Exception';

  const sevEl = document.getElementById('solveSeverity');
  const severity = (data.severity || 'medium').toLowerCase();
  sevEl.className = `severity-pill ${severity}`;
  sevEl.textContent = severity.toUpperCase();

  const confidencePct = Math.round((data.confidence || 0.95) * 100);
  document.getElementById('solveConfidence').textContent = `${confidencePct}% Match`;

  const lang = data.language && data.language !== 'auto-detect' ? data.language : 'General';
  const fw = data.framework && data.framework !== 'auto-detect' ? data.framework : 'Standard Context';
  document.getElementById('solveDetectedContext').textContent = `${lang} • ${fw}`;

  document.getElementById('solveSummaryText').textContent = data.summary || 'Compiler or runtime error detected.';

  // Segment 1: Root Cause & Complexity
  document.getElementById('solveRootCauseText').textContent = data.rootCause || 'Target payload failed runtime invariant.';

  const patternsContainer = document.getElementById('solvePatternsList');
  patternsContainer.innerHTML = '';
  const patterns = data.relatedPatterns || ['Standard Defensive Guard'];
  patterns.forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'pattern-tag';
    tag.textContent = p;
    patternsContainer.appendChild(tag);
  });

  const opt = data.optimization || {};
  document.getElementById('solveOptComplexity').textContent = opt.complexity || 'Time: O(N) | Space: O(1)';
  document.getElementById('solveOptPerf').textContent = opt.performance || 'Prevents runtime crash';
  document.getElementById('solveOptSec').textContent = opt.security || 'Guarded parameter validation';
  document.getElementById('solveOptMaint').textContent = opt.maintainability || 'Production-grade safety pattern';

  // Segment 2: Code Fix & Diff Patch
  const fixDesc = data.solution?.description || 'Apply defensive guard fix.';
  const fixCode = data.solution?.code || '// Safe replacement code';
  document.getElementById('solveFixDesc').textContent = fixDesc;
  document.getElementById('solveFixCode').textContent = fixCode;

  // Render Diff
  const diffViewer = document.getElementById('solveDiffViewer');
  diffViewer.innerHTML = '';
  const rawDiff = data.fixDiff || '@@ -1,1 +1,1 @@\n-const unsafe = target;\n+const safe = target ?? fallback;';
  const lines = rawDiff.split('\n');
  lines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'diff-line';
    if (line.startsWith('@@')) {
      div.classList.add('header');
    } else if (line.startsWith('+')) {
      div.classList.add('add');
    } else if (line.startsWith('-')) {
      div.classList.add('del');
    }
    div.textContent = line;
    diffViewer.appendChild(div);
  });

  document.getElementById('solveFixExplanationText').textContent = data.explanation || 'Replaced direct execution with guarded nullish/parameterized check.';
  const sideEffects = data.sideEffects || 'None detected.';
  const considerations = data.considerations ? ` ${data.considerations}` : '';
  document.getElementById('solveFixSideEffectsText').textContent = `Side Effects: ${sideEffects}${considerations}`;

  // Segment 3: Plain-English Explainer
  document.getElementById('solveMeaningText').textContent = data.meaning || data.summary || 'An operation was attempted on an invalid state reference.';
  document.getElementById('solveLikelyCauseText').textContent = data.likelyCause || 'Missing dependency, asynchronous timing mismatch, or parameter error.';

  const conceptsList = document.getElementById('solveConceptsList');
  conceptsList.innerHTML = '';
  const concepts = data.concepts || ['Defensive Programming', 'Null Safety', 'Error Handling'];
  concepts.forEach(c => {
    const chip = document.createElement('span');
    chip.className = 'concept-tag';
    chip.textContent = c;
    conceptsList.appendChild(chip);
  });

  const stepsList = document.getElementById('solveStepsList');
  stepsList.innerHTML = '';
  const steps = data.nextSteps || [
    'Inspect the line referenced in the stack trace for uninitialized data access.',
    'Add fallback defaults or optional chaining to prevent unhandled rejections.',
    'Verify asynchronous operations complete before accessing nested properties.'
  ];
  steps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    stepsList.appendChild(li);
  });
}

function copyTextToClipboard(text, successToastMsg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successToastMsg);
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// ==========================================================================
// 2. INTERACTIVE AI DEBUGGER CHAT
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

    // AI thinking placeholder
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
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==========================================================================
// 3. BUG INGESTION FORM
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
      showToast(`Bug ${bugId} ingested into ledger!`);
    } catch (err) {
      showToast(`Ingestion failed: ${err.message}`, 'error');
    } finally {
      spinner.hidden = true;
      btnText.textContent = 'Submit to BugGraph Ledger';
      submitBtn.disabled = false;
    }
  });
}

// ==========================================================================
// 4. SETTINGS & HEALTH MODULE
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

      await res.json();
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
  initDebugChatModule();
  initIngestModule();
  initSettingsModule();

  document.getElementById('refreshStatusBtn').addEventListener('click', fetchEngineStatus);

  fetchEngineStatus();
  loadConfig();
});
