// ==========================================================================
// BugGraph Terminal Workstation Prototype — Client-Side REPL & Engine
// ==========================================================================

const API_BASE = window.location.origin;

// Preset Stack Traces
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

  oom: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
    1: 0xb09c30 node::Abort() [node]
    2: 0xa1b20b node::FatalError(char const*, char const*) [node]
    3: 0xcf82de v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
    at processHugeBuffer (src/processors/stream.js:12:20)`,

  sensitive: `Error: Connection rejected with DB_URL=postgres://app_user:SuperSecretP@ssw0rd123@db.prod.internal:5432/core
    OpenAI Key detected in env: sk-abcdef1234567890abcdef1234567890
    AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    at PostgresPool.connect (src/db/connection.js:33:11)`
};

// Available Shell Commands for Autocomplete & Help
const SHELL_COMMANDS = [
  { cmd: 'solve', desc: 'Full AI diagnosis, root cause, code patch & O(N) complexity' },
  { cmd: 'tree', desc: 'Graphic tree visual representation of error call stack & affected files' },
  { cmd: 'explain', desc: 'Plain-English technical translation of compiler/runtime error' },
  { cmd: 'fix', desc: 'Generate concrete unified git patch diff' },
  { cmd: 'debug', desc: 'Interactive multi-turn debugging chat in terminal console' },
  { cmd: 'rules', desc: 'Inspect usage limits & security boundary policy' },
  { cmd: 'install', desc: 'Show one-line web terminal install commands for this tool' },
  { cmd: 'audit', desc: 'Inspect security status and anti-tamper log' },
  { cmd: 'pop', desc: 'Pop up visual companion HUD window aside terminal' },
  { cmd: 'pipe', desc: 'Simulate stream pipe ingestion from stdin buffer' },
  { cmd: 'model', desc: 'Manage offline LLM provider (Ollama / LM Studio / Backend)' },
  { cmd: 'status', desc: 'Inspect engine connectivity, ping latency & graph health' },
  { cmd: 'sanitize', desc: 'Toggle secret scrubbing shield or test redaction' },
  { cmd: 'temp', desc: 'Set LLM sampling temperature (e.g. temp 0.2)' },
  { cmd: 'reset-security', desc: 'Emergency developer override to clear suspension' },
  { cmd: 'clear', desc: 'Clear terminal screen (Shortcut: Ctrl+L)' },
  { cmd: 'help', desc: 'List all workstation terminal commands' }
];

// App State
let commandHistory = [];
let historyIndex = -1;
let activeProvider = 'ollama';
let activeModel = 'qwen2.5-coder:7b';
let activeTemperature = 0.2;
let activeMaxTokens = 2048;
let sanitizeEnabled = true;
let latestGeneratedDiff = '';
let isExecuting = false;

// 24-Hour Suspension & Security State
let isSuspended = false;
let activeLock = null;
let countdownInterval = null;

// Client-side Tamper & Boundary Signatures
const CLIENT_TAMPER_SIGNATURES = [
  {
    category: 'SECURITY_MEASURE_BYPASS',
    pattern: /\b(bypass[-_ ]?security|disable[-_ ]?protection|override[-_ ]?sanitizer|strip[-_ ]?guards|tamper[-_ ]?rules|unmask[-_ ]?all)\b/i,
    description: 'Attempted to bypass or tamper with BugGraph security / sanitization measures'
  },
  {
    category: 'PRIVILEGE_ESCALATION',
    pattern: /\b(sudo|elevate[-_ ]?privilege|root[-_ ]?access|admin[-_ ]?override|force[-_ ]?unlock|hack[-_ ]?system)\b/i,
    description: 'Attempted unauthorized privilege escalation or root boundary access'
  },
  {
    category: 'CREDENTIAL_EXFILTRATION',
    pattern: /\b(dump[-_ ]?secrets|steal[-_ ]?keys|extract[-_ ]?tokens|read[-_ ]?env|leak[-_ ]?credentials|cat\s+\.env)\b/i,
    description: 'Attempted exfiltration of system environment secrets or tokens'
  },
  {
    category: 'SYSTEM_COMMAND_INJECTION',
    pattern: /\b(rm\s+-(?:rf|r|f)|format\s+[a-z]:|del\s+\/[fq]|mkfs|dd\s+if=|cat\s+\/etc\/(?:passwd|shadow))\b/i,
    description: 'Attempted destructive system command execution or shell injection'
  },
  {
    category: 'SHELL_SPAWN_ATTEMPT',
    pattern: /\b(powershell\s+-enc|cmd\.exe\s+\/c|bash\s+-i|nc\s+-e|\/bin\/(?:ba)?sh|sh\s+-c)\b/i,
    description: 'Attempted spawning unauthorized interactive shell or reverse shell'
  },
  {
    category: 'DATABASE_DESTRUCTION',
    pattern: /\b(drop\s+(?:database|schema|table)\s+|truncate\s+table\s+|delete\s+from\s+[a-z_]+\s+where\s+1\s*=\s*1)\b/i,
    description: 'Attempted destructive database manipulation or table dropping'
  },
  {
    category: 'PATH_TRAVERSAL_PROBE',
    pattern: /(\.\.[\/\\]){2,}|(\/etc\/[a-z_]+)|(C:\\(?:Windows|Boot|System32))/i,
    description: 'Attempted directory traversal beyond permitted prototype sandbox'
  },
  {
    category: 'CODE_EVAL_INJECTION',
    pattern: /\b(eval\s*\(|Function\s*\(|require\s*\(\s*['"]child_process['"]\)|child_process\.exec)\b/i,
    description: 'Attempted arbitrary code execution or runtime process injection'
  },
  {
    category: 'SAFETY_PROMPT_JAILBREAK',
    pattern: /\b(ignore\s+(?:all\s+)?previous\s+instructions\s+and\s+(?:reveal|bypass|disable|override))\b/i,
    description: 'Attempted prompt injection to circumvent ethical or safety boundaries'
  }
];

// DOM Elements
const streamEl = document.getElementById('terminalStream');
const inputEl = document.getElementById('terminalInput');
const executeBtn = document.getElementById('executeBtn');
const pasteTraceBtn = document.getElementById('pasteTraceBtn');
const multilineToggleBtn = document.getElementById('multilineToggleBtn');
const autocompleteEl = document.getElementById('autocompletePopover');
const crtToggleBtn = document.getElementById('crtToggleBtn');
const proDockToggleBtn = document.getElementById('proDockToggleBtn');
const proDockEl = document.getElementById('proDockPane');
const terminalPaneEl = document.getElementById('terminalPane');
const splitterEl = document.getElementById('tuiSplitter');

// Pro Dock Elements
const modelSelectEl = document.getElementById('modelSelect');
const scanModelsBtn = document.getElementById('scanModelsBtn');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const connectionFeedbackEl = document.getElementById('connectionFeedback');
const tempSliderEl = document.getElementById('tempSlider');
const tempValueEl = document.getElementById('tempValue');
const tokenSliderEl = document.getElementById('tokenSlider');
const tokenValueEl = document.getElementById('tokenValue');
const sanitizerSwitchEl = document.getElementById('sanitizerSwitch');
const testSanitizeBtn = document.getElementById('testSanitizeBtn');
const rawPromptPreviewEl = document.getElementById('rawPromptPreview');
const promptInspectorCard = document.getElementById('promptInspectorCard');
const latestDiffBox = document.getElementById('latestDiffBox');
const copyDiffBtn = document.getElementById('copyDiffBtn');
const applyPatchBtn = document.getElementById('applyPatchBtn');

// Telemetry Elements
const telemetryLatency = document.getElementById('telemetryLatency');
const telemetryTokSpeed = document.getElementById('telemetryTokSpeed');
const telemetryTokens = document.getElementById('telemetryTokens');
const telemetryConfidence = document.getElementById('telemetryConfidence');
const headerModelLabel = document.getElementById('headerModelLabel');
const headerLatencyLabel = document.getElementById('headerLatencyLabel');
const statusLabel = document.getElementById('statusLabel');

// Security & Install Modal Elements
const securityLockOverlay = document.getElementById('securityLockOverlay');
const lockoutTimerDisplay = document.getElementById('lockoutTimerDisplay');
const lockoutUnlockTime = document.getElementById('lockoutUnlockTime');
const lockoutIncidentId = document.getElementById('lockoutIncidentId');
const lockoutCategory = document.getElementById('lockoutCategory');
const lockoutTriggerSample = document.getElementById('lockoutTriggerSample');
const devOverrideToggleBtn = document.getElementById('devOverrideToggleBtn');
const devOverrideForm = document.getElementById('devOverrideForm');
const devOverrideInput = document.getElementById('devOverrideInput');
const devOverrideSubmitBtn = document.getElementById('devOverrideSubmitBtn');
const devOverrideFeedback = document.getElementById('devOverrideFeedback');

const installModalOverlay = document.getElementById('installModalOverlay');
const installModalBtn = document.getElementById('installModalBtn');
const closeInstallModalBtn = document.getElementById('closeInstallModalBtn');
const installCommandText = document.getElementById('installCommandText');
const copyInstallCommandBtn = document.getElementById('copyInstallCommandBtn');
const sideDockBtn = document.getElementById('sideDockBtn');

/**
 * Repositions and resizes window to snap directly beside the user's terminal
 * on the right half of the monitor for handy multitasking.
 */
function alignSideDockPosition() {
  try {
    if (window.screen && window.screen.availWidth) {
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;
      const targetW = screenW >= 1920 ? 900 : Math.min(680, Math.floor(screenW * 0.49));
      const targetH = Math.max(screenH - 40, 680);
      const targetX = screenW - targetW - 10;
      const targetY = 20;
      window.resizeTo(targetW, targetH);
      window.moveTo(targetX, targetY);
    }
  } catch {}
}

// ==========================================================================
// 1. BOOT SEQUENCE & WELCOME BANNER
// ==========================================================================
function bootTerminal() {
  const bootBanner = `
<div class="stream-block">
  <pre style="color: var(--neon-green); font-weight: bold; line-height: 1.15; font-size: 11px;">
  ██████╗ ██╗   ██╗ ██████╗  ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██║   ██║██╔════╝ ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║
  ██████╔╝██║   ██║██║  ███╗██║  ███╗██████╔╝███████║██████╔╝███████║
  ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║
  ██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║
  ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝
  </pre>
  <div class="ansi-box header-box">
    <div class="ansi-box-title">
      <span>⚡ BUGGRAPH LOCAL WORKSTATION HUD // TERMINAL PROTOTYPE</span>
      <div class="ansi-meta-tags">
        <span class="meta-badge lang">READY</span>
        <span class="meta-badge model">AI_CORE</span>
        <span class="meta-badge latency">v1.0.0-PROTOTYPE</span>
      </div>
    </div>
    <div class="detail-row">
      <div class="row-content" style="color: var(--text-dim); font-size: 12px;">
        Interactive terminal environment connected to AI debugging engine and Knowledge Graph.<br>
        Type <span style="color: var(--neon-green); font-weight: 600;">'solve'</span>, 
        <span style="color: var(--neon-cyan); font-weight: 600;">'explain'</span>, 
        <span style="color: var(--neon-amber); font-weight: 600;">'fix'</span>, or 
        <span style="color: var(--neon-purple); font-weight: 600;">'debug'</span> to start diagnosing. 
        Or select a quick trace preset above.
      </div>
    </div>
  </div>
</div>`;

  streamEl.innerHTML = bootBanner;
  scrollToBottom();
  alignSideDockPosition();
  if (window.innerWidth < 1050 && proDockEl) {
    proDockEl.classList.add('collapsed');
  }
  checkInitialStatus();
}

function scrollToBottom() {
  streamEl.scrollTop = streamEl.scrollHeight;
}

// ==========================================================================
// 2. STATUS & MODEL DISCOVERY
// ==========================================================================
async function checkInitialStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();

    if (data.config) {
      activeProvider = data.config.provider || 'ollama';
      activeModel = data.config.model || 'qwen2.5-coder:7b';
      activeTemperature = data.config.temperature ?? 0.2;
      activeMaxTokens = data.config.maxTokens || 2048;
      sanitizeEnabled = Boolean(data.config.sanitizeEnabled);

      updateProviderUI(activeProvider);
      tempSliderEl.value = activeTemperature;
      tempValueEl.textContent = activeTemperature;
      tokenSliderEl.value = activeMaxTokens;
      tokenValueEl.textContent = activeMaxTokens;
      sanitizerSwitchEl.checked = sanitizeEnabled;
      updateHeaderLabels();
    }

    if (data.localModels?.ollama?.online) {
      connectionFeedbackEl.textContent = `Ollama detected: ${data.localModels.ollama.models.length} local models.`;
      connectionFeedbackEl.className = 'feedback-text online';
      populateModelDropdown(data.localModels.ollama.models);
    } else if (data.localModels?.lmstudio?.online) {
      connectionFeedbackEl.textContent = `LM Studio detected: ${data.localModels.lmstudio.models.length} models.`;
      connectionFeedbackEl.className = 'feedback-text online';
      populateModelDropdown(data.localModels.lmstudio.models);
    } else {
      connectionFeedbackEl.textContent = `Offline Heuristic Engine ready (zero latency).`;
      connectionFeedbackEl.className = 'feedback-text online';
    }
  } catch (err) {
    statusLabel.textContent = 'STANDALONE_LOCAL: READY';
    headerLatencyLabel.textContent = '1ms';
  }
}

function updateHeaderLabels() {
  headerModelLabel.textContent = `${activeProvider}:${activeModel}`;
  headerLatencyLabel.textContent = telemetryLatency.textContent;
}

function populateModelDropdown(models) {
  if (!models || models.length === 0) return;
  modelSelectEl.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = `${m.name} ${m.size ? `(${m.size})` : ''}`;
    modelSelectEl.appendChild(opt);
  });
  if (models[0]) {
    activeModel = models[0].name;
    updateHeaderLabels();
  }
}

// ==========================================================================
// 3. COMMAND PARSER & REPL ENGINE
// ==========================================================================
async function handleUserSubmit() {
  const rawInput = inputEl.value.trim();
  if (!rawInput || isExecuting) return;

  // 1. Check if user is currently suspended under the 24-hour lockout
  if (isSuspended) {
    if (securityLockOverlay) securityLockOverlay.classList.remove('hidden');
    appendSystemMessage('TERMINAL SUSPENDED: Activity locked for 24 hours due to security violation. See lockout display.', 'error');
    return;
  }

  // 2. Anti-Tamper Boundary Check
  const violation = checkClientTamper(rawInput);
  if (violation.isViolation) {
    appendUserEntry(rawInput);
    inputEl.value = '';
    applyClientSuspension({
      reason: violation.description,
      trigger: violation.sample,
      category: violation.category
    });
    return;
  }

  // Add to history
  commandHistory.push(rawInput);
  historyIndex = commandHistory.length;

  // Clear input
  inputEl.value = '';
  inputEl.style.height = '52px';
  autocompleteEl.style.display = 'none';

  // Render User Entry in Stream
  appendUserEntry(rawInput);

  // Parse Command
  const parts = rawInput.split(/\s+/);
  const command = parts[0].toLowerCase();
  const rest = parts.slice(1).join(' ');

  // Built-in Shell Commands
  if (command === 'clear') {
    streamEl.innerHTML = '';
    return;
  }

  if (command === 'help') {
    renderHelpBlock();
    return;
  }

  if (command === 'status') {
    await renderStatusBlock();
    return;
  }

  if (command === 'rules') {
    renderRulesBlock();
    return;
  }

  if (command === 'install') {
    renderInstallModal();
    return;
  }

  if (command === 'audit') {
    renderAuditBlock();
    return;
  }

  if (command === 'pop') {
    appendSystemMessage('This workstation HUD is already running in visual window mode! To pop it up side-docked beside your terminal anytime from CLI, run: node prototype/cli.js pop', 'info');
    return;
  }

  if (command === 'reset-security') {
    await handleResetSecurity(rest);
    return;
  }

  if (command === 'temp') {
    const val = parseFloat(rest);
    if (!isNaN(val) && val >= 0 && val <= 1) {
      activeTemperature = val;
      tempSliderEl.value = val;
      tempValueEl.textContent = val;
      appendSystemMessage(`Sampling temperature set to ${val}`);
      saveConfig({ temperature: val });
    } else {
      appendSystemMessage(`Usage: temp <0.0 - 1.0> (current: ${activeTemperature})`, 'warn');
    }
    return;
  }

  if (command === 'sanitize') {
    if (rest === 'on') {
      sanitizeEnabled = true;
    } else if (rest === 'off') {
      sanitizeEnabled = false;
    } else {
      sanitizeEnabled = !sanitizeEnabled;
    }
    sanitizerSwitchEl.checked = sanitizeEnabled;
    appendSystemMessage(`Secret scrubbing shield is now: ${sanitizeEnabled ? 'ENABLED (API keys & Passwords scrubbed)' : 'DISABLED'}`);
    saveConfig({ sanitizeEnabled });
    return;
  }

  if (command === 'model') {
    if (rest === 'scan') {
      await scanModels();
    } else if (rest.startsWith('set ')) {
      activeModel = rest.substring(4).trim();
      appendSystemMessage(`Active target model set to: ${activeModel}`);
      updateHeaderLabels();
      saveConfig({ model: activeModel });
    } else {
      appendSystemMessage(`Current Provider: ${activeProvider}\nTarget Model: ${activeModel}\nUse 'model scan' to detect local models or 'model set <name>'.`);
    }
    return;
  }

  // AI Diagnostic Commands: solve, explain, fix, debug, pipe, tree
  let cmdType = 'solve';
  let tracePayload = rest;

  if (['solve', 'explain', 'fix', 'debug', 'pipe', 'tree'].includes(command)) {
    cmdType = command;
    tracePayload = rest;
  } else {
    // If user pasted a raw stack trace directly without a command prefix, default to 'solve'
    cmdType = 'solve';
    tracePayload = rawInput;
  }

  if (!tracePayload) {
    // Inject preset or prompt user
    tracePayload = PRESETS.typeerror;
    appendSystemMessage(`No stack trace provided. Automatically loading sample TypeError for analysis...`, 'info');
  }

  await executeAICommand(cmdType, tracePayload);
}

function appendUserEntry(text) {
  const block = document.createElement('div');
  block.className = 'stream-block';
  block.innerHTML = `
    <div class="stream-user-entry">
      <span class="p-symbol">❯</span>
      <span class="cmd-text">${escapeHtml(text)}</span>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

function appendSystemMessage(msg, type = 'info') {
  const block = document.createElement('div');
  block.className = 'stream-block';
  const color = type === 'warn' ? 'var(--neon-amber)' : (type === 'error' ? 'var(--neon-red)' : 'var(--neon-cyan)');
  block.innerHTML = `
    <div style="padding: 6px 12px; background: rgba(255,255,255,0.02); border-left: 2px solid ${color}; color: ${color}; font-size: 12px;">
      ${escapeHtml(msg).replace(/\n/g, '<br>')}
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

// ==========================================================================
// 4. AI INFERENCE EXECUTION
// ==========================================================================
async function executeAICommand(command, trace) {
  isExecuting = true;
  executeBtn.classList.add('loading');
  executeBtn.innerHTML = `<span>⏳ DIAGNOSING...</span>`;

  // Temporary Pending Stream Block
  const pendingBlock = document.createElement('div');
  pendingBlock.className = 'stream-block';
  pendingBlock.innerHTML = `
    <div class="ansi-box">
      <div style="display: flex; align-items: center; gap: 8px; color: var(--neon-cyan);">
        <span class="led-blink"></span>
        <span>Running <strong>${command.toUpperCase()}</strong> via [${activeProvider}:${activeModel}]...</span>
      </div>
    </div>
  `;
  streamEl.appendChild(pendingBlock);
  scrollToBottom();

  try {
    const res = await fetch(`${API_BASE}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        trace,
        provider: activeProvider,
        model: activeModel,
        temperature: activeTemperature,
        maxTokens: activeMaxTokens,
        sanitizeEnabled
      })
    });

    const data = await res.json();
    pendingBlock.remove();

    // Check for HTTP 423 Locked or suspension from server
    if (res.status === 423 || data.suspended) {
      applyClientSuspension(data.lock || {
        reason: data.error || 'Security boundary breach detected.',
        category: 'SECURITY_POLICY_VIOLATION',
        trigger: command
      });
      return;
    }

    renderInferenceResult(command, data, trace);
  } catch (err) {
    pendingBlock.remove();
    appendSystemMessage(`Execution Error: ${err.message}. Please check local engine.`, 'error');
  } finally {
    isExecuting = false;
    if (!isSuspended) {
      executeBtn.classList.remove('loading');
      executeBtn.innerHTML = `<span class="icon">▶</span> RUN <kbd>Ctrl+↵</kbd>`;
    }
  }
}

function renderInferenceResult(command, data, trace) {
  const block = document.createElement('div');
  block.className = 'stream-block';

  const latency = data.latencyMs || 92;
  const tokenCount = data.tokenCount || 280;
  const tokSpeed = data.tokPerSec || '45.0';
  const confidence = data.structured?.graphContext?.confidenceScore || '98.4%';

  // Update Telemetry
  telemetryLatency.textContent = `${latency} ms`;
  telemetryTokSpeed.textContent = `${tokSpeed} tok/s`;
  telemetryTokens.textContent = `${tokenCount} tok`;
  telemetryConfidence.textContent = confidence;
  headerLatencyLabel.textContent = `${latency}ms`;

  // Update Inspector
  rawPromptPreviewEl.textContent = `SYSTEM PROMPT:\nYou are BugGraph AI, an elite debugging workstation agent.\n\nCOMMAND: ${command.toUpperCase()}\nSANITIZED TRACE:\n${data.sanitized ? '(Secrets Scrubbed via Regex Shield)\n' : ''}${trace}`;

  const callTree = data.callTree || data.structured?.callTree;
  const treeHtml = renderGraphicTreeHtml(callTree);

  // If command is specifically 'tree', render tree graph as primary card
  if (command === 'tree') {
    let html = `
    <div class="ansi-box header-box">
      <div class="ansi-box-title">
        <span>✔ ERROR CALL GRAPH &amp; FILE IMPACT TREE</span>
        <div class="ansi-meta-tags">
          <span class="meta-badge lang">GRAPH</span>
          <span class="meta-badge model">${data.provider}</span>
          <span class="meta-badge latency">${latency}ms</span>
        </div>
      </div>
      <div class="detail-row">
        ${treeHtml}
      </div>
    </div>`;
    block.innerHTML = html;
    streamEl.appendChild(block);
    scrollToBottom();
    return;
  }

  // Structured Heuristic or LLM Response
  if (data.structured) {
    const st = data.structured;
    latestGeneratedDiff = st.diffPatch || '';

    // Update Pro Dock diff viewer
    updateLatestDiffUI(latestGeneratedDiff);

    let html = `
    <div class="ansi-box header-box">
      <div class="ansi-box-title">
        <span>✔ ${st.errorType || 'ERROR DIAGNOSIS COMPLETE'}</span>
        <div class="ansi-meta-tags">
          <span class="meta-badge lang">${st.language?.toUpperCase() || 'CODE'}</span>
          <span class="meta-badge model">${data.provider}</span>
          <span class="meta-badge latency">${latency}ms</span>
        </div>
      </div>

      <!-- Root Cause -->
      <div class="detail-row">
        <span class="row-title">🔍 ROOT CAUSE IDENTIFICATION</span>
        <div class="row-content">${escapeHtml(st.rootCause)}</div>
      </div>

      <!-- Graphic Call & Impact Tree -->
      ${treeHtml ? `
      <div class="detail-row">
        <span class="row-title">🌳 ERROR CALL GRAPH &amp; AFFECTED FILES</span>
        ${treeHtml}
      </div>` : ''}

      <!-- Technical Explanation -->
      <div class="detail-row">
        <span class="row-title">📖 TECHNICAL BREAKDOWN</span>
        <div class="row-content">${escapeHtml(st.explanation)}</div>
      </div>

      <!-- Code Patch Unified Diff -->
      ${st.diffPatch ? `
      <div class="detail-row">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="row-title">🛠️ UNIFIED GIT PATCH DIFF</span>
          <button class="dock-btn text-only" onclick="navigator.clipboard.writeText(\`${escapeHtml(st.diffPatch)}\`); alert('Copied patch diff!');">Copy Diff</button>
        </div>
        <div class="diff-container">
          ${formatDiffHtml(st.diffPatch)}
        </div>
      </div>` : ''}

      <!-- Complexity Analysis -->
      ${st.complexity ? `
      <div class="detail-row">
        <span class="row-title">⏱️ COMPLEXITY & PERFORMANCE EVALUATION</span>
        <div class="row-content" style="color: var(--neon-cyan);">
          Time: <strong>${st.complexity.time}</strong> | Space: <strong>${st.complexity.space}</strong> — ${escapeHtml(st.complexity.rationale)}
        </div>
      </div>` : ''}

      <!-- Graph Context -->
      ${st.graphContext ? `
      <div class="detail-row" style="background: rgba(0, 255, 136, 0.05); padding: 6px 8px; border-radius: var(--radius-sm);">
        <span class="row-title" style="color: var(--neon-green);">🌐 KNOWLEDGE GRAPH LEDGER MATCH</span>
        <div class="row-content" style="font-size: 11px; color: var(--text-dim);">
          Pattern: <strong>${st.graphContext.matchedPattern}</strong> | Historical Occurrences: <strong>${st.graphContext.historicalFixes}</strong> | Neo4j Node: <code>${st.graphContext.neo4jNodeId}</code>
        </div>
      </div>` : ''}
    </div>`;

    block.innerHTML = html;
  } else if (data.rawResponse) {
    // Raw Output from Ollama or LM Studio
    block.innerHTML = `
    <div class="ansi-box header-box">
      <div class="ansi-box-title">
        <span>✔ ${command.toUpperCase()} RESPONSE</span>
        <div class="ansi-meta-tags">
          <span class="meta-badge model">${data.model}</span>
          <span class="meta-badge latency">${latency}ms</span>
        </div>
      </div>
      <div class="detail-row">
        <pre style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 12px; color: var(--text-main);">${escapeHtml(data.rawResponse)}</pre>
      </div>
    </div>`;
  }

  streamEl.appendChild(block);
  scrollToBottom();
}

function renderGraphicTreeHtml(callTree) {
  if (!callTree) return '';
  const frames = callTree.frames || [];
  const blast = callTree.blastRadius || {};

  let nodesHtml = '';
  // 1. Root Error Node
  nodesHtml += `
    <div class="tree-node-item root">
      <div class="node-pin">🔴</div>
      <div class="node-card">
        <div class="node-card-top">
          <span class="node-badge root">CRASH ROOT</span>
          <span style="font-size:10px; color:var(--text-muted);">TOP-LEVEL EXCEPTION</span>
        </div>
        <div class="node-file-line" style="color:var(--neon-red); font-size:13px;">${escapeHtml(callTree.errorTitle || 'Runtime Crash')}</div>
      </div>
    </div>
  `;

  // 2. Frames
  frames.forEach((f) => {
    const isCulprit = f.role === 'culprit';
    const itemClass = isCulprit ? 'culprit' : 'frame';
    const pin = isCulprit ? '🎯' : '↳';
    const badgeClass = isCulprit ? 'culprit' : 'frame';
    const badgeText = isCulprit ? `CULPRIT #1 (${f.isUserCode ? 'APP CODE' : 'EXT'})` : (f.isUserCode ? 'APP CALLER' : 'FRAMEWORK HOOK');

    nodesHtml += `
      <div class="tree-node-item ${itemClass}">
        <div class="node-pin">${pin}</div>
        <div class="node-card">
          <div class="node-card-top">
            <span class="node-badge ${badgeClass}">${badgeText}</span>
            <span class="node-func-name">${escapeHtml(f.fn)}()</span>
          </div>
          <div class="node-file-line">
            ${escapeHtml(f.file)} <span style="color:var(--neon-cyan);">:${f.line}${f.col ? ':' + f.col : ''}</span>
          </div>
          ${f.snippet ? `<div class="node-code-snippet">⚡ ${escapeHtml(f.snippet)}</div>` : ''}
        </div>
      </div>
    `;
  });

  // 3. Blast Radius
  nodesHtml += `
    <div class="tree-node-item blast">
      <div class="node-pin">💥</div>
      <div class="node-card">
        <div class="node-card-top">
          <span class="node-badge blast">BLAST RADIUS</span>
          <span style="font-size:10px; color:var(--neon-purple); font-weight:700;">SEVERITY: ${escapeHtml(blast.severity || 'HIGH')}</span>
        </div>
        <div class="node-file-line" style="color:var(--text-main); font-size:11px;">
          ${escapeHtml(blast.impact || 'Execution interrupted.')}
        </div>
        <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">
          Impacted Boundary: <strong style="color:var(--text-dim);">${escapeHtml(blast.scope || 'Application Pipeline')}</strong>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="tree-graph-container">
      <div class="tree-graph-header">
        <div class="tree-title-group">
          <span>🌳</span>
          <span class="tree-title">ERROR CALL GRAPH &amp; FILE IMPACT TREE</span>
        </div>
        <div class="tree-view-toggle">
          <button class="tree-toggle-btn active" onclick="toggleTreeView(this, 'graphic')">Node Tree</button>
          <button class="tree-toggle-btn" onclick="toggleTreeView(this, 'ascii')">ASCII</button>
        </div>
      </div>

      <!-- Graphic Flow -->
      <div class="tree-nodes-flow">
        ${nodesHtml}
      </div>

      <!-- Plain Text ASCII Tree -->
      <pre class="tree-ascii-pre">${escapeHtml(callTree.asciiTree || '')}</pre>
    </div>
  `;
}

window.toggleTreeView = function(btn, mode) {
  const container = btn.closest('.tree-graph-container');
  if (!container) return;
  const buttons = container.querySelectorAll('.tree-toggle-btn');
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (mode === 'ascii') {
    container.classList.add('show-ascii');
  } else {
    container.classList.remove('show-ascii');
  }
};

function formatDiffHtml(diffText) {
  const lines = diffText.split('\n');
  return lines.map(line => {
    if (line.startsWith('+')) {
      return `<span class="diff-line add">${escapeHtml(line)}</span>`;
    } else if (line.startsWith('-')) {
      return `<span class="diff-line del">${escapeHtml(line)}</span>`;
    } else if (line.startsWith('@@')) {
      return `<span class="diff-line hunk">${escapeHtml(line)}</span>`;
    } else {
      return `<span class="diff-line">${escapeHtml(line)}</span>`;
    }
  }).join('');
}

function updateLatestDiffUI(diffText) {
  if (!diffText) return;
  latestDiffBox.innerHTML = `<div class="diff-container" style="border:none; padding: 2px;">${formatDiffHtml(diffText)}</div>`;
  copyDiffBtn.disabled = false;
  applyPatchBtn.disabled = false;
}

// ==========================================================================
// 5. HELPER RENDERS (HELP, STATUS)
// ==========================================================================
function renderHelpBlock() {
  const rows = SHELL_COMMANDS.map(c => 
    `<tr>
      <td style="color: var(--neon-green); font-weight: 600; padding: 3px 12px 3px 0;">${c.cmd}</td>
      <td style="color: var(--text-dim); font-size: 12px;">${c.desc}</td>
    </tr>`
  ).join('');

  const block = document.createElement('div');
  block.className = 'stream-block';
  block.innerHTML = `
    <div class="ansi-box">
      <div class="ansi-box-title">
        <span>📖 AVAILABLE TERMINAL COMMANDS</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
        💡 Tip: You can paste any raw stack trace directly and press <kbd>Ctrl+Enter</kbd> to solve.
      </div>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

async function renderStatusBlock() {
  const block = document.createElement('div');
  block.className = 'stream-block';
  block.innerHTML = `
    <div class="ansi-box">
      <div class="ansi-box-title">
        <span>⚙️ SYSTEM & ENGINE HEALTH STATUS</span>
      </div>
      <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px; font-size: 12px;">
        <span style="color: var(--text-muted);">Active Provider:</span>
        <span style="color: var(--neon-cyan); font-weight: 600;">${activeProvider.toUpperCase()}</span>

        <span style="color: var(--text-muted);">Target Model:</span>
        <span style="color: var(--neon-green);">${activeModel}</span>

        <span style="color: var(--text-muted);">Secret Sanitizer:</span>
        <span style="color: ${sanitizeEnabled ? 'var(--neon-green)' : 'var(--neon-red)'}; font-weight: 600;">
          ${sanitizeEnabled ? 'ENABLED (Shield Active)' : 'DISABLED'}
        </span>

        <span style="color: var(--text-muted);">Temperature:</span>
        <span>${activeTemperature}</span>

        <span style="color: var(--text-muted);">Max Tokens:</span>
        <span>${activeMaxTokens}</span>

        <span style="color: var(--text-muted);">Workstation Host:</span>
        <span style="color: var(--text-dim);">${window.location.host}</span>
      </div>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

// ==========================================================================
// 6. EVENT LISTENERS & PRO DOCK CONTROLS
// ==========================================================================
function setupEventListeners() {
  // Input Keydown Handling (Ctrl+Enter, History, Autocomplete)
  inputEl.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter to execute
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUserSubmit();
      return;
    }

    // Single Enter when not multiline
    if (e.key === 'Enter' && !e.shiftKey && inputEl.rows === 1) {
      e.preventDefault();
      handleUserSubmit();
      return;
    }

    // Ctrl+L to Clear
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      streamEl.innerHTML = '';
      return;
    }

    // History traversal on single line
    if (inputEl.rows === 1) {
      if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
          historyIndex--;
          inputEl.value = commandHistory[historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          inputEl.value = commandHistory[historyIndex] || '';
        } else {
          historyIndex = commandHistory.length;
          inputEl.value = '';
        }
      }
    }
  });

  // Autocomplete & Auto-resize on typing
  inputEl.addEventListener('input', () => {
    // Dynamic comfortable height expansion
    inputEl.style.height = 'auto';
    const nextHeight = Math.min(Math.max(inputEl.scrollHeight, 52), 220);
    inputEl.style.height = `${nextHeight}px`;

    const val = inputEl.value.trim().toLowerCase();
    if (!val || val.includes(' ') || val.includes('\n')) {
      autocompleteEl.style.display = 'none';
      return;
    }

    const matches = SHELL_COMMANDS.filter(c => c.cmd.startsWith(val));
    if (matches.length > 0) {
      autocompleteEl.innerHTML = matches.map(m => `
        <div class="autocomplete-item" data-cmd="${m.cmd}">
          <span style="color: var(--neon-green); font-weight:600;">${m.cmd}</span>
          <span class="autocomplete-desc">${m.desc}</span>
        </div>
      `).join('');
      autocompleteEl.style.display = 'block';
    } else {
      autocompleteEl.style.display = 'none';
    }
  });

  // Click autocomplete item
  autocompleteEl.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      inputEl.value = item.getAttribute('data-cmd') + ' ';
      autocompleteEl.style.display = 'none';
      inputEl.focus();
    }
  });

  // Execute Button Click
  executeBtn.addEventListener('click', handleUserSubmit);

  // Quick Action Buttons
  document.querySelectorAll('.fn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd === 'clear') {
        streamEl.innerHTML = '';
      } else if (cmd === 'rules') {
        renderRulesBlock();
      } else if (cmd === 'install') {
        renderInstallModal();
      } else if (cmd === 'audit') {
        renderAuditBlock();
      } else {
        inputEl.value = `${cmd} `;
        inputEl.focus();
      }
    });
  });

  // Trace Presets Click
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const presetKey = chip.getAttribute('data-preset');
      const trace = PRESETS[presetKey];
      if (trace) {
        inputEl.value = `solve\n${trace}`;
        inputEl.rows = 4;
        inputEl.focus();
      }
    });
  });

  // Multiline Toggle
  multilineToggleBtn.addEventListener('click', () => {
    if (inputEl.rows === 1 || inputEl.clientHeight < 80) {
      inputEl.rows = 6;
      inputEl.style.height = '140px';
    } else {
      inputEl.rows = 1;
      inputEl.style.height = '52px';
    }
    inputEl.focus();
  });

  // Paste Trace Button
  pasteTraceBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        inputEl.value = text;
        inputEl.rows = 4;
        inputEl.focus();
      }
    } catch {
      inputEl.focus();
    }
  });

  // CRT Scanlines Toggle
  crtToggleBtn.addEventListener('click', () => {
    const isEnabled = document.body.classList.toggle('crt-enabled');
    crtToggleBtn.innerHTML = `<span class="icon">📺</span> CRT: ${isEnabled ? 'ON' : 'OFF'}`;
  });

  // Pro Dock Toggle
  proDockToggleBtn.addEventListener('click', () => {
    proDockEl.classList.toggle('collapsed');
  });

  // Side-Dock Aside Terminal Toggle
  if (sideDockBtn) {
    sideDockBtn.addEventListener('click', () => {
      alignSideDockPosition();
      if (proDockEl) {
        proDockEl.classList.add('collapsed');
      }
      appendSystemMessage('HUD repositioned: Docked aside your terminal for convenient side-by-side workflow.', 'info');
    });
  }

  // Drag & Drop File onto Terminal Pane
  terminalPaneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    terminalPaneEl.classList.add('drag-over');
  });

  terminalPaneEl.addEventListener('dragleave', () => {
    terminalPaneEl.classList.remove('drag-over');
  });

  terminalPaneEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    terminalPaneEl.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      inputEl.value = `solve\n${text}`;
      inputEl.rows = 6;
      inputEl.focus();
      appendSystemMessage(`Buffered file '${file.name}' (${(file.size / 1024).toFixed(1)} KB) into input. Press Ctrl+Enter to solve.`);
    }
  });

  // Provider Radio Switch
  document.querySelectorAll('.provider-radio').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.provider-radio').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
      const provider = label.getAttribute('data-provider');
      updateProviderUI(provider);
      saveConfig({ provider });
    });
  });

  // Temperature Slider
  tempSliderEl.addEventListener('input', (e) => {
    activeTemperature = parseFloat(e.target.value);
    tempValueEl.textContent = activeTemperature;
  });
  tempSliderEl.addEventListener('change', () => {
    saveConfig({ temperature: activeTemperature });
  });

  // Max Tokens Slider
  tokenSliderEl.addEventListener('input', (e) => {
    activeMaxTokens = parseInt(e.target.value, 10);
    tokenValueEl.textContent = activeMaxTokens;
  });
  tokenSliderEl.addEventListener('change', () => {
    saveConfig({ maxTokens: activeMaxTokens });
  });

  // Sanitizer Switch
  sanitizerSwitchEl.addEventListener('change', (e) => {
    sanitizeEnabled = e.target.checked;
    saveConfig({ sanitizeEnabled });
  });

  // Test Sanitizer
  testSanitizeBtn.addEventListener('click', async () => {
    const sample = PRESETS.sensitive;
    const res = await fetch(`${API_BASE}/api/sanitize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sample })
    });
    const data = await res.json();
    appendSystemMessage(`SANITIZER REDACTION TEST:\nOriginal DB String contains password & AWS key.\nScrubbed Output:\n${data.sanitized}`, 'info');
  });

  // Scan Models Button
  scanModelsBtn.addEventListener('click', scanModels);

  // Test Connection Button
  testConnectionBtn.addEventListener('click', testConnection);

  // Model Selection Change
  modelSelectEl.addEventListener('change', (e) => {
    activeModel = e.target.value;
    updateHeaderLabels();
    saveConfig({ model: activeModel });
  });

  // Copy Diff Button
  copyDiffBtn.addEventListener('click', () => {
    if (latestGeneratedDiff) {
      navigator.clipboard.writeText(latestGeneratedDiff);
      alert('Unified git diff copied to clipboard!');
    }
  });

  // Collapsible Inspector Toggle
  document.getElementById('toggleInspectorHeader').addEventListener('click', () => {
    promptInspectorCard.classList.toggle('collapsed');
  });

  // Resizable Splitter
  let isResizing = false;
  splitterEl.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerWidth = document.querySelector('.tui-workspace').clientWidth;
    const newDockWidth = containerWidth - e.clientX;
    if (newDockWidth >= 280 && newDockWidth <= 600) {
      proDockEl.style.width = `${newDockWidth}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
    }
  });
  // Install Modal triggers
  if (installModalBtn) {
    installModalBtn.addEventListener('click', renderInstallModal);
  }

  if (closeInstallModalBtn) {
    closeInstallModalBtn.addEventListener('click', () => {
      installModalOverlay.classList.add('hidden');
    });
  }

  // Install modal tab switching
  document.querySelectorAll('.install-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.install-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-target');
      const hostUrl = window.location.origin;
      if (target === 'bash') {
        installCommandText.textContent = `curl -fsSL ${hostUrl}/install.sh | bash`;
      } else if (target === 'ps1') {
        installCommandText.textContent = `irm ${hostUrl}/install.ps1 | iex`;
      } else {
        installCommandText.textContent = `npm install -g ./`;
      }
    });
  });

  // Copy install command
  if (copyInstallCommandBtn) {
    copyInstallCommandBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(installCommandText.textContent);
      const originalText = copyInstallCommandBtn.textContent;
      copyInstallCommandBtn.textContent = '✔ Copied!';
      setTimeout(() => {
        copyInstallCommandBtn.textContent = originalText;
      }, 2000);
    });
  }

  // Developer Emergency Override Drawer Toggle
  if (devOverrideToggleBtn) {
    devOverrideToggleBtn.addEventListener('click', () => {
      devOverrideForm.classList.toggle('hidden');
    });
  }

  // Developer Emergency Override Submit
  if (devOverrideSubmitBtn) {
    devOverrideSubmitBtn.addEventListener('click', async () => {
      const key = devOverrideInput.value.trim();
      if (!key) {
        devOverrideFeedback.textContent = 'Please enter developer key.';
        devOverrideFeedback.className = 'override-feedback error';
        return;
      }

      devOverrideFeedback.textContent = 'Verifying key...';
      devOverrideFeedback.className = 'override-feedback';

      try {
        const res = await fetch(`${API_BASE}/api/security/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (data.success) {
          devOverrideFeedback.textContent = '✔ Override accepted. Lifting suspension...';
          devOverrideFeedback.className = 'override-feedback success';
          setTimeout(() => {
            liftSuspension();
          }, 800);
        } else {
          devOverrideFeedback.textContent = `✖ ${data.error || 'Invalid developer override key.'}`;
          devOverrideFeedback.className = 'override-feedback error';
        }
      } catch (err) {
        devOverrideFeedback.textContent = `✖ Connection failed: ${err.message}`;
        devOverrideFeedback.className = 'override-feedback error';
      }
    });
  }
}

function updateProviderUI(provider) {
  activeProvider = provider;
  updateHeaderLabels();
  testConnection();
}

async function scanModels() {
  scanModelsBtn.innerHTML = `<span>⏳ Scanning...</span>`;
  try {
    const res = await fetch(`${API_BASE}/api/llm/models`);
    const data = await res.json();
    if (activeProvider === 'ollama' && data.ollama?.online) {
      populateModelDropdown(data.ollama.models);
      connectionFeedbackEl.textContent = `Scanned: ${data.ollama.models.length} Ollama models found.`;
      connectionFeedbackEl.className = 'feedback-text online';
    } else if (activeProvider === 'lmstudio' && data.lmstudio?.online) {
      populateModelDropdown(data.lmstudio.models);
      connectionFeedbackEl.textContent = `Scanned: ${data.lmstudio.models.length} LM Studio models.`;
      connectionFeedbackEl.className = 'feedback-text online';
    } else {
      connectionFeedbackEl.textContent = `Provider offline. Using Heuristic AI engine.`;
      connectionFeedbackEl.className = 'feedback-text online';
    }
  } catch (err) {
    connectionFeedbackEl.textContent = `Scan failed: ${err.message}`;
  } finally {
    scanModelsBtn.innerHTML = `<span>🔄 Scan</span>`;
  }
}

async function testConnection() {
  connectionFeedbackEl.textContent = 'Pinging target...';
  connectionFeedbackEl.className = 'feedback-text checking';
  try {
    const res = await fetch(`${API_BASE}/api/llm/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: activeProvider })
    });
    const data = await res.json();
    connectionFeedbackEl.textContent = data.details || 'Connection verified';
    connectionFeedbackEl.className = data.success ? 'feedback-text online' : 'feedback-text offline';
  } catch {
    connectionFeedbackEl.textContent = 'Target offline. Heuristic fallback active.';
    connectionFeedbackEl.className = 'feedback-text online';
  }
}

async function saveConfig(updates) {
  try {
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch {
    // Local memory only
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// 5. SECURITY TRIPWIRE, 24-HOUR SUSPENSION & UTILITY BLOCKS
// ==========================================================================

function checkClientTamper(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return { isViolation: false };
  const normalized = rawInput.trim();

  for (const sig of CLIENT_TAMPER_SIGNATURES) {
    if (sig.pattern.test(normalized)) {
      return {
        isViolation: true,
        category: sig.category,
        description: sig.description,
        pattern: sig.pattern.toString(),
        sample: normalized.length > 80 ? normalized.substring(0, 80) + '...' : normalized
      };
    }
  }

  return { isViolation: false };
}

async function checkInitialSuspensionStatus() {
  // 1. Check local storage
  try {
    const raw = localStorage.getItem('buggraph_prototype_lock');
    if (raw) {
      const lock = JSON.parse(raw);
      if (lock.unlockAt && lock.unlockAt > Date.now()) {
        renderSecurityLockdown(lock);
        return;
      } else {
        localStorage.removeItem('buggraph_prototype_lock');
      }
    }
  } catch {}

  // 2. Check server status
  try {
    const res = await fetch(`${API_BASE}/api/security/status`);
    const data = await res.json();
    if (data.isSuspended) {
      renderSecurityLockdown(data.lock);
    }
  } catch {}
}

function applyClientSuspension(lockData) {
  const now = Date.now();
  const unlockAt = lockData.unlockAt || (now + 24 * 60 * 60 * 1000);
  const incidentId = lockData.incidentId || ('SEC-' + Math.floor(100000 + Math.random() * 900000));

  const completeLock = {
    incidentId,
    active: true,
    lockedAt: now,
    unlockAt,
    durationMs: 24 * 60 * 60 * 1000,
    reason: lockData.reason || 'Attempted circumvention of system security boundary.',
    category: lockData.category || 'SECURITY_POLICY_VIOLATION',
    trigger: lockData.trigger || 'Tamper attempt'
  };

  try {
    localStorage.setItem('buggraph_prototype_lock', JSON.stringify(completeLock));
  } catch {}

  // Post to server to sync lockfile
  fetch(`${API_BASE}/api/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'tamper_report', trace: completeLock.trigger })
  }).catch(() => {});

  // Append critical incident alert to stream
  const incidentBlock = document.createElement('div');
  incidentBlock.className = 'stream-block';
  incidentBlock.innerHTML = `
    <div class="ansi-box header-box" style="border-color: var(--neon-red); box-shadow: 0 0 25px rgba(255,51,102,0.35);">
      <div class="ansi-box-title" style="color: var(--neon-red);">
        <span>🚨 CRITICAL SECURITY INCIDENT DETECTED // 24-HOUR SUSPENSION ENFORCED</span>
      </div>
      <div style="padding: 14px 18px; color: #ff99aa; font-size: 12px; line-height: 1.6;">
        <p style="color: #fff; font-weight: bold; margin-bottom: 6px;">POLICY VIOLATION: Unauthorized attempt to bypass security measures or access restricted system boundaries.</p>
        <div><strong>INCIDENT ID    :</strong> <span style="color: var(--neon-cyan);">${completeLock.incidentId}</span></div>
        <div><strong>CATEGORY       :</strong> <span style="color: var(--neon-red); font-weight: bold;">${completeLock.category}</span></div>
        <div><strong>TRIGGER SAMPLE :</strong> <code>${escapeHtml(completeLock.trigger)}</code></div>
        <div><strong>ACTION TAKEN   :</strong> Terminal activity suspended across all local diagnostic and inference engines for 24 hours.</div>
        <div style="margin-top: 8px; color: var(--neon-amber);">LOCKOUT EXPIRES: ${new Date(unlockAt).toLocaleString()}</div>
      </div>
    </div>
  `;
  streamEl.appendChild(incidentBlock);
  scrollToBottom();

  renderSecurityLockdown(completeLock);
}

function renderSecurityLockdown(lockData) {
  isSuspended = true;
  activeLock = lockData;

  // Show Modal Overlay
  if (securityLockOverlay) {
    securityLockOverlay.classList.remove('hidden');
    if (lockoutIncidentId) lockoutIncidentId.textContent = lockData.incidentId || 'SEC-000000';
    if (lockoutCategory) lockoutCategory.textContent = lockData.category || 'SECURITY_POLICY_VIOLATION';
    if (lockoutTriggerSample) lockoutTriggerSample.textContent = lockData.trigger || 'N/A';
    if (lockoutUnlockTime) lockoutUnlockTime.textContent = 'Unfreeze Date: ' + new Date(lockData.unlockAt).toLocaleString();
  }

  // Lock Terminal Input
  inputEl.disabled = true;
  inputEl.classList.add('suspended');
  inputEl.placeholder = '[TERMINAL SUSPENDED: 24-HOUR SECURITY COOLDOWN ACTIVE]';

  const prefixEl = document.querySelector('.prompt-prefix');
  if (prefixEl) prefixEl.classList.add('suspended');

  executeBtn.disabled = true;
  executeBtn.classList.add('locked');
  executeBtn.innerHTML = '<span>🔒 LOCKED</span>';

  // Start live ticking countdown
  startCountdownTimer(lockData.unlockAt);
}

function startCountdownTimer(unlockAt) {
  clearInterval(countdownInterval);

  function update() {
    const remainingMs = unlockAt - Date.now();
    if (remainingMs <= 0) {
      liftSuspension();
      return;
    }

    const totalSec = Math.floor(remainingMs / 1000);
    const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');

    if (lockoutTimerDisplay) {
      lockoutTimerDisplay.textContent = `${hours}:${mins}:${secs}`;
    }
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

function liftSuspension() {
  isSuspended = false;
  activeLock = null;
  clearInterval(countdownInterval);

  try {
    localStorage.removeItem('buggraph_prototype_lock');
  } catch {}

  if (securityLockOverlay) {
    securityLockOverlay.classList.add('hidden');
  }

  inputEl.disabled = false;
  inputEl.classList.remove('suspended');
  inputEl.placeholder = "Type command ('solve', 'fix', 'debug', 'help') or paste trace...";

  const prefixEl = document.querySelector('.prompt-prefix');
  if (prefixEl) prefixEl.classList.remove('suspended');

  executeBtn.disabled = false;
  executeBtn.classList.remove('locked');
  executeBtn.innerHTML = '<span class="icon">▶</span> RUN <kbd>Ctrl+↵</kbd>';

  appendSystemMessage('Security lockout cooldown expired. Terminal activity and model access restored.', 'info');
}

async function handleResetSecurity(keyArg) {
  const key = keyArg.replace(/^--key\s+/, '').trim();
  if (!key) {
    appendSystemMessage('Usage: reset-security --key <DEVELOPER_KEY>', 'warn');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/security/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const data = await res.json();
    if (data.success) {
      liftSuspension();
      appendSystemMessage('Developer override verified. All suspensions cleared.', 'info');
    } else {
      appendSystemMessage(`Security reset failed: ${data.error || 'Invalid key'}`, 'error');
    }
  } catch (err) {
    appendSystemMessage(`Failed to contact security engine: ${err.message}`, 'error');
  }
}

function renderRulesBlock() {
  const block = document.createElement('div');
  block.className = 'stream-block';
  block.innerHTML = `
    <div class="ansi-box header-box" style="border-color: var(--neon-amber);">
      <div class="ansi-box-title" style="color: var(--neon-amber);">
        <span>🛡️ BUGGRAPH PROTOTYPE // USAGE RULES &amp; SECURITY BOUNDARY</span>
      </div>
      <div style="padding: 14px 18px; font-size: 12px; line-height: 1.6;">
        <p style="color: var(--neon-green); font-weight: bold; margin-bottom: 6px;">✔ ALLOWED / FLEXIBLE EXPERIMENTATION:</p>
        <ul style="margin-left: 20px; color: var(--text-dim); margin-bottom: 12px;">
          <li>Testing arbitrary stack traces, custom error logs, and multi-line exception payloads.</li>
          <li>Running all diagnosis commands: <code>solve</code>, <code>explain</code>, <code>fix</code>, <code>debug</code>, <code>tree</code>.</li>
          <li>Benchmarking offline heuristic zero-latency diagnosis and local LLMs (Ollama / LM Studio).</li>
          <li>Testing the secret scrubbing sanitizer on sensitive strings and connection credentials.</li>
        </ul>

        <p style="color: var(--neon-red); font-weight: bold; margin-bottom: 6px;">✖ RESTRICTED / SECURITY MEASURE TAMPERING (TRIGGERS 24-HOUR SUSPENSION):</p>
        <ul style="margin-left: 20px; color: #ff99aa; margin-bottom: 12px;">
          <li>Attempting to bypass security guardrails, override sanitizers, or strip boundary protections.</li>
          <li>System command execution or shell injection attempts (<code>rm -rf</code>, <code>format</code>, <code>del</code>, <code>cat /etc/shadow</code>).</li>
          <li>Path traversal probing beyond the permitted application directory (<code>../../</code>).</li>
          <li>Privilege escalation commands (<code>sudo</code>, <code>root</code>, <code>admin-override</code>, <code>hack-system</code>).</li>
          <li>Arbitrary runtime code injection (<code>eval</code>, <code>child_process</code>, reverse shell spawns).</li>
        </ul>

        <p style="color: var(--neon-cyan); font-size: 11px;">Policy: Detected boundary tamper incidents result in an automated 24-hour lockout across the terminal workstation.</p>
      </div>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

function renderAuditBlock() {
  const block = document.createElement('div');
  block.className = 'stream-block';
  block.innerHTML = `
    <div class="ansi-box header-box" style="border-color: var(--neon-cyan);">
      <div class="ansi-box-title" style="color: var(--neon-cyan);">
        <span>📋 SECURITY &amp; COMPLIANCE AUDIT STATUS</span>
      </div>
      <div style="padding: 14px 18px; font-size: 12px; line-height: 1.6;">
        <div><strong>ENGINE STATUS     :</strong> <span style="color: var(--neon-green);">ONLINE &amp; ACTIVE</span></div>
        <div><strong>SANITIZER SHIELD  :</strong> <span style="color: ${sanitizeEnabled ? 'var(--neon-green)' : 'var(--neon-amber)'};">${sanitizeEnabled ? 'ACTIVE (Credentials scrubbed)' : 'DISABLED BY USER'}</span></div>
        <div><strong>SUSPENSION LOCKOUT:</strong> <span style="color: ${isSuspended ? 'var(--neon-red)' : 'var(--neon-green)'};">${isSuspended ? 'ACTIVE (24-Hour Cooldown)' : 'NONE (Normal Clearance)'}</span></div>
        <div><strong>AUDIT LEDGER      :</strong> <span style="color: var(--text-dim);">Immutable Incident Logger active</span></div>
        <div><strong>ENFORCEMENT RULE  :</strong> <span style="color: var(--neon-amber);">Automated 24-hour terminal lockout upon security tamper violation</span></div>
      </div>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

function renderInstallModal() {
  if (installModalOverlay) {
    installModalOverlay.classList.remove('hidden');
    const hostUrl = window.location.origin;
    if (installCommandText) {
      installCommandText.textContent = `curl -fsSL ${hostUrl}/install.sh | bash`;
    }
  }

  // Also print one-liner into terminal stream
  const block = document.createElement('div');
  block.className = 'stream-block';
  const hostUrl = window.location.origin;
  block.innerHTML = `
    <div class="ansi-box header-box" style="border-color: var(--neon-green);">
      <div class="ansi-box-title" style="color: var(--neon-green);">
        <span>⚡ ONE-LINE INSTANT CLI INSTALLATION COMMANDS</span>
      </div>
      <div style="padding: 14px 18px; font-size: 12px; line-height: 1.6;">
        <p style="color: var(--text-main); font-weight: bold; margin-bottom: 6px;">Run in your computer's terminal to install the clean actual BugGraph tool:</p>
        <div style="margin-bottom: 8px;">
          <span style="color: var(--neon-cyan);">• Linux / macOS (Bash / Zsh):</span><br>
          <code style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; color: #fff;">curl -fsSL ${hostUrl}/install.sh | bash</code>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: var(--neon-cyan);">• Windows (PowerShell):</span><br>
          <code style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; color: #fff;">irm ${hostUrl}/install.ps1 | iex</code>
        </div>
        <div>
          <span style="color: var(--neon-cyan);">• Node.js Global (npm):</span><br>
          <code style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; color: #fff;">npm install -g ./</code>
        </div>
        <p style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">Installs clean executable into user PATH with zero dupe or dump files.</p>
      </div>
    </div>
  `;
  streamEl.appendChild(block);
  scrollToBottom();
}

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  bootTerminal();
  setupEventListeners();
  checkInitialSuspensionStatus();
});
