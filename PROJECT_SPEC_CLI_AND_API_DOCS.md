# BugGraph: Project Objectives, CLI Workstation & API Documentation

> **Complete Technical Specification, Architecture Overview, CLI Manual, and API Reference.**  
> *Designed for backend engineers, frontend developers updating mock/production data contracts, and DevOps integrators.*  
> **Notice**: All sensitive tokens and keys in this specification are sanitized using production placeholder notation (`bg_token_...`, `<DEVELOPER_OVERRIDE_KEY>`).

---

## 📑 Table of Contents

1. [Project Main Objectives & Architecture](#1-project-main-objectives--architecture)
   - [1.1 Core Vision](#11-core-vision)
   - [1.2 From Bug Storage to AI Debugging Workstation](#12-from-bug-storage-to-ai-debugging-workstation)
   - [1.3 Hybrid Multi-Tier AI & Graph Architecture](#13-hybrid-multi-tier-ai--graph-architecture)
   - [1.4 Security Boundary & 24-Hour Lockout Policy](#14-security-boundary--24-hour-lockout-policy)
2. [CLI Workstation Documentation](#2-cli-workstation-documentation)
   - [2.1 Input Modalities (Paste, Pipe, File, Flag)](#21-input-modalities)
   - [2.2 Execution Modes (Terminal, REPL, Popup HUD, Detached)](#22-execution-modes)
   - [2.3 Complete CLI Command Reference (All 22 Commands)](#23-complete-cli-command-reference)
   - [2.4 1-Click Launchers & Windows Service Wrappers](#24-1-click-launchers--windows-service-wrappers)
3. [API Documentation & Data Contracts](#3-api-documentation--data-contracts)
   - [3.1 Authentication & Global Headers](#31-authentication--global-headers)
   - [3.2 Health & Configuration APIs](#32-health--configuration-apis)
   - [3.3 AI Diagnostic & Analysis APIs](#33-ai-diagnostic--analysis-apis)
   - [3.4 Universal Workstation Execution API (`/api/command`)](#34-universal-workstation-execution-api)
   - [3.5 Knowledge Graph & Intelligence Endpoints](#35-knowledge-graph--intelligence-endpoints)
   - [3.6 Security & Anti-Tamper APIs](#36-security--anti-tamper-apis)
   - [3.7 Bug Ingestion & Ledger APIs](#37-bug-ingestion--ledger-apis)
   - [3.8 Web Installer & Clean Distribution Endpoints](#38-web-installer--clean-distribution-endpoints)
4. [Frontend Mock Data Replacement Guide](#4-frontend-mock-data-replacement-guide)
   - [4.1 Scenario A: React Nullish Dereference (TypeError)](#41-scenario-a-react-nullish-dereference-typeerror)
   - [4.2 Scenario B: SQL Injection / Syntax Fault (CWE-89)](#42-scenario-b-sql-injection--syntax-fault-cwe-89)
   - [4.3 Scenario C: Node.js V8 Heap Out Of Memory (OOM)](#43-scenario-c-nodejs-v8-heap-out-of-memory-oom)
   - [4.4 Scenario D: Upstream Connection Timeout (Network Fault)](#44-scenario-d-upstream-connection-timeout-network-fault)
   - [4.5 Scenario E: Security Violation Lockout (423 Locked)](#45-scenario-e-security-violation-lockout-423-locked)
5. [Data Sanitization & Secret Scrubbing Standards](#5-data-sanitization--secret-scrubbing-standards)

---

# 1. Project Main Objectives & Architecture

## 1.1 Core Vision
BugGraph is an **AI-Powered Bug-Pattern Knowledge Graph Workstation**. While traditional application monitoring tools (APM, Sentry, Datadog) focus on capturing and alerting on exceptions (*"A crash occurred at line 42"*), BugGraph bridges the gap between **detection** and **resolution**:
1. **Pattern Matching**: Evaluates stack traces against historical bug clusters in a Neo4j knowledge graph.
2. **Blast Radius Computation**: Determines which downstream microservices, render trees, and database connections are severed by the failure.
3. **Algorithmic Optimization**: Evaluates time ($O$) and space complexity, calculating GC churn and memory footprint improvements before and after patch application.
4. **Concrete Patch Generation**: Automatically produces unified git diffs (`diff -u`) with side-effect warnings.
5. **Interactive Guidance**: Provides a dual-mode workflow (Cyberpunk CLI Terminal REPL + Standalone Desktop Window Utility HUD).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRADITIONAL APM vs. BUGGRAPH                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ Traditional APM:                     │ BugGraph AI Workstation:             │
│ • "TypeError: undefined is not a obj"│ • Error Classification & Culprit     │
│ • Alert sent to Slack                │ • Downstream Blast Radius Tree       │
│ • Raw stack trace dump               │ • Knowledge Graph Pattern Clustering │
│ • Manual developer triage needed     │ • Time/Space Big-O Complexity Audit  │
│                                      │ • Unified Git Patch Diff Generator   │
│                                      │ • Zero-Latency Offline Fallback AI   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

## 1.2 From Bug Storage to AI Debugging Workstation
The original system operated as a simple ingest client (`POST /api/bugs`). The upgraded platform elevates this into a unified diagnostic pipeline:

```mermaid
flowchart TD
    subgraph Developer Workstation
        A[Input Source: Copy/Paste | Stdin Pipe | Disk File] --> B[Multiline Buffer & Sanitizer]
        B --> C{Execution Router}
        C -->|CLI One-Shot| D1[Node.js Terminal Formatter]
        C -->|Interactive REPL| D2[Cyberpunk Shell]
        C -->|Desktop Popup HUD| D3[Dedicated Web Workstation Window]
    end

    subgraph BugGraph Local Workstation Engine
        D1 & D2 & D3 --> E[Local HTTP Server :4567]
        E --> F[Tamper Tripwire & Lockout Auditor]
        F --> G[Secret Scrubbing Sanitizer Shield]
        G --> H{Inference Router}
        H -->|Local LLM| I1[Ollama :11434 / LM Studio :1234]
        H -->|Remote Gateway| I2[Central Backend :3000 / Neo4j]
        H -->|Zero-Latency Fallback| I3[Built-in Heuristic Knowledge Engine]
    end

    subgraph Output Deliverables
        I1 & I2 & I3 --> J1[Call Graph & Culprit Tree]
        I1 & I2 & I3 --> J2[Unified Git Patch Diff]
        I1 & I2 & I3 --> J3[Big-O Complexity Report]
        I1 & I2 & I3 --> J4[Security / CWE Vulnerability Score]
    end
```

## 1.3 Hybrid Multi-Tier AI & Graph Architecture
The workstation does not depend on cloud uptime. It implements a 4-tier waterfall:
1. **Tier 1 — Local Ollama**: Connects to `http://127.0.0.1:11434` (e.g. `qwen2.5-coder:7b`, `codellama`, `deepseek-coder`).
2. **Tier 2 — Local LM Studio**: Connects via OpenAI-compatible API to `http://127.0.0.1:1234/v1`.
3. **Tier 3 — Central Backend**: Connects to production BugGraph API gateway (`http://127.0.0.1:3000/api/debug/*`).
4. **Tier 4 — Built-in Heuristic Knowledge Engine**: 100% offline, zero-latency deterministic parser that extracts stack frames, calculates culprit lines, determines blast radius, and outputs patches even without an active internet connection or GPU.

## 1.4 Security Boundary & 24-Hour Lockout Policy
To permit developer experimentation while preventing abuse and malicious injection, BugGraph enforces cryptographic tamper tripwires:
- **Allowed**: Custom stack traces, multi-language errors, stress benchmarks, secret sanitizer tests, and local model switching.
- **Restricted**: Shell injection (`rm -rf`, `del`, `format`), privilege escalation (`sudo`, `root`), directory traversal (`../../`), arbitrary code eval (`child_process`, `eval`), and safety jailbreak attempts.
- **Violation Penalty**: Any trigger initiates an immediate **24-hour terminal lockout** across CLI and API endpoints (`HTTP 423 Locked`). Emergency developer unlocks are supported via:
  ```bash
  buggraph reset-security --key <DEVELOPER_OVERRIDE_KEY>
  ```

---

# 2. CLI Workstation Documentation

## 2.1 Input Modalities
Every diagnostic command in BugGraph supports three input streams:

### 1. Interactive Paste Buffer
Running any command bare prompts the developer for multiline input:
```bash
buggraph solve
```
```text
┌──────────────────────────────────────────────────────────────┐
│ BugGraph AI Error Solver                                     │
│ Paste your error trace below. Press Ctrl+D (or Ctrl+Z) to end:│
└──────────────────────────────────────────────────────────────┘
```

### 2. Stdin Pipe (CI/CD Pipeline Integration)
Directly pipe compiler outputs, test failures, or log files:
```bash
npm test 2>&1 | buggraph solve
cat /var/log/nginx/error.log | buggraph explain
pytest 2>&1 | buggraph triage
```

### 3. Direct File Flag
Pass target log files directly from disk:
```bash
buggraph solve --file logs/crash.log
buggraph blast-radius --file /tmp/trace.txt
```

---

## 2.2 Execution Modes

| Mode | Command | Description |
|---|---|---|
| **Desktop Popup HUD (Foreground)** | `npm run pop` or `node bin/buggraph.js pop` | Launches the dedicated standalone desktop window docked beside your terminal (`1260x840`) and runs until Ctrl+C. |
| **Desktop Popup HUD (Detached)** | `node bin/buggraph.js pop --detach` | Spawns the server in the background and opens the desktop window, **freeing your terminal immediately**. |
| **1-Click Silent Desktop Launcher** | Double-click `launch-buggraph.vbs` | Runs completely silently (**zero terminal window opened**), popping the HUD directly on screen. |
| **Interactive Cyberpunk Shell** | `npm run shell` or `node bin/buggraph.js shell` | Full REPL shell inside terminal with command history, tab autocomplete, and live model switcher. |
| **Interactive Selection Menu** | `node bin/buggraph.js --cli` | Arrow-key prompt menu for quick navigation. |
| **One-Shot Direct Command** | `node bin/buggraph.js solve "<trace>"` | Instant execution and formatted console output. |

---

## 2.3 Complete CLI Command Reference

### `buggraph pop`
Launches the dedicated visual Cyberpunk Terminal Workstation HUD outside the terminal.
- **Options**:
  - `-p, --port <port>`: Port to bind workstation server (Default: `4567`).
  - `-d, --detach`: Launches background daemon and frees terminal immediately.
  - `--cmd`, `--term`: Opens a dedicated native CMD terminal window instead of browser HUD.

### `buggraph shell`
Enters the interactive Cyberpunk REPL environment with stateful commands, history (`↑`/`↓`), and tab completion.

### `buggraph solve [trace...]`
Analyzes error stack traces, isolates primary culprit, generates code fix, and evaluates algorithmic time/space complexity.
- **Options**:
  - `-f, --file <path>`: Read error trace from local file.
  - `-l, --language <lang>`: Specify programming language (`javascript`, `python`, `go`, `sql`, etc.).
  - `-w, --framework <fw>`: Specify framework (`react`, `express`, `django`, `spring`, etc.).
  - `-c, --component <name>`: Target component/module name.
  - `--json`: Output raw structured JSON instead of formatted boxes.

### `buggraph explain [trace...]`
Translates cryptic compiler, linker, or runtime errors into clear technical English. Breaks down error meaning, location, core concepts, and recommended next steps.

### `buggraph fix [trace...]`
Produces a concrete, syntactically correct patch in unified git diff format (`--- a/... +++ b/...`) along with side effects and security considerations.

### `buggraph debug [query...]`
Initiates a stateful, multi-turn AI debugging session where the model asks for missing lines of code or runtime context until the bug is diagnosed.
- **Options**:
  - `-s, --session <id>`: Resume an existing multi-turn session ID.
  - `-f, --file <path>`: Load context file.

### `buggraph blast-radius [trace...]` (Alias: `tree`)
Computes the downstream ripple effect across the dependency graph. Shows culprit files, affected services, circuit-breaker recommendations, and an ASCII call stack tree.

### `buggraph similarity [trace...]` (Alias: `cluster`)
Fingerprints the error trace using SHA-256 and searches the BugGraph knowledge graph for historical incident clusters, verified solutions, and Mean Time to Resolution (MTTR) metrics.

### `buggraph cve [trace...]` (Alias: `vuln`)
Performs static security auditing on error traces. Detects CWE identifiers (e.g. CWE-89 SQLi, CWE-79 XSS, CWE-209 Sensitive Leak), OWASP Top 10 mappings, CVSS scores, and safe remediation code.

### `buggraph triage [trace...]`
Calculates automated incident priority tiers (`P0` through `P3`), response SLA targets (`1 Hour` to `5 Days`), and generates a GitHub / Jira ready Markdown ticket.

### `buggraph benchmark [trace...]` (Alias: `bench`)
Evaluates before-and-after Big-O time and space complexity, V8 garbage collector impact, heap memory overhead, and latency gains.

### `buggraph patch-test [diff...]` (Alias: `dry-run`)
Simulates application of a unified git diff without modifying working directory state. Validates target file existence, line addition/deletion metrics, and hunk integrity.

### `buggraph sanitize [text...]`
CLI secret scrubbing tool. Removes OpenAI/Gemini API keys, AWS credentials, Bearer/JWT tokens, passwords, and database connection URIs.

### `buggraph auth <token>`
Authenticates developer identity and writes bearer secret to local user configuration (`~/.buggraph/config.json`).

### `buggraph status`
Checks workstation engine health, local LLM connectivity (Ollama / LM Studio), backend endpoint status, and authentication credentials.

### `buggraph log`
Submits a manual bug report into the central BugGraph knowledge graph ledger.
- **Options**:
  - `-t, --title <title>`: Short error title.
  - `-s, --severity <level>`: `low` | `medium` | `high` | `critical`.
  - `-c, --component <comp>`: System component name.
  - `-m, --message <msg>`: Full error body or log.

### `buggraph pipe`
Continuous stream pipe consumer for CI/CD runners. Reads chunked logs from stdin and ingests them into the knowledge graph.

### `buggraph rules`
Displays the workstation usage boundaries, flexibility guidelines, and 24-hour tamper lockout policies.

### `buggraph audit`
Inspects security posture, active tamper shield status, and lockout cooldown status.

### `buggraph reset-security --key <KEY>`
Emergency developer override key to clear active 24-hour security lockouts.

### `buggraph install`
Displays copy-paste one-line installation commands for Linux, macOS, and Windows.

---

## 2.4 1-Click Launchers & Windows Service Wrappers

### VBScript Silent Launcher (`launch-buggraph.vbs`)
Double-clicking launches the BugGraph desktop HUD window without opening any terminal or command prompt window:
```vbscript
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = strPath
WshShell.Run "node bin/buggraph.js pop --detach", 0, False
```

### Windows Batch Launcher (`launch-buggraph.bat`)
```batch
@echo off
cd /d "%~dp0"
start /b "" node "%~dp0bin\buggraph.js" pop --detach
```

---

# 3. API Documentation & Data Contracts

All endpoints return standard HTTP status codes and JSON payloads with CORS enabled (`Access-Control-Allow-Origin: *`).

## 3.1 Authentication & Global Headers

```http
Authorization: Bearer bg_token_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

- When unauthenticated or running offline, the local workstation server seamlessly routes to the internal heuristic knowledge engine with zero degradation of feature output.

---

## 3.2 Health & Configuration APIs

### `GET /api/status`
Returns comprehensive engine health, local model availability, configuration parameters, and active security status.

**Response `200 OK`**:
```json
{
  "online": true,
  "mode": "Terminal Workstation HUD",
  "provider": "ollama",
  "model": "qwen2.5-coder:7b",
  "localModels": {
    "ollama": {
      "online": true,
      "models": [
        {
          "name": "qwen2.5-coder:7b",
          "size": "4.7 GB",
          "modifiedAt": "2026-10-30T10:14:02.112Z"
        },
        {
          "name": "deepseek-coder:6.7b",
          "size": "3.8 GB",
          "modifiedAt": "2026-10-28T04:22:18.409Z"
        }
      ]
    },
    "lmstudio": {
      "online": false,
      "models": []
    }
  },
  "config": {
    "provider": "ollama",
    "ollamaUrl": "http://127.0.0.1:11434",
    "lmStudioUrl": "http://127.0.0.1:1234/v1",
    "backendUrl": "http://127.0.0.1:3000",
    "model": "qwen2.5-coder:7b",
    "temperature": 0.2,
    "maxTokens": 2048,
    "sanitizeEnabled": true
  },
  "security": {
    "isSuspended": false,
    "remainingMs": 0
  },
  "endpoint": "http://127.0.0.1:3000",
  "authenticated": true,
  "token": "bg_token_s..."
}
```

---

### `GET /api/config`
Retrieves persistent CLI and workstation runtime configurations.

**Response `200 OK`**:
```json
{
  "endpoint": "http://127.0.0.1:3000",
  "token": "bg_token_sec_99182318491240182",
  "activeSessionId": "sess_819203",
  "workstation": {
    "provider": "ollama",
    "ollamaUrl": "http://127.0.0.1:11434",
    "lmStudioUrl": "http://127.0.0.1:1234/v1",
    "backendUrl": "http://127.0.0.1:3000",
    "model": "qwen2.5-coder:7b",
    "temperature": 0.2,
    "maxTokens": 2048,
    "sanitizeEnabled": true
  }
}
```

---

### `POST /api/config`
Updates runtime settings, active model provider, and secret credentials.

**Request Body**:
```json
{
  "provider": "lmstudio",
  "model": "local-model",
  "temperature": 0.1,
  "maxTokens": 1024,
  "sanitizeEnabled": true
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "config": {
    "endpoint": "http://127.0.0.1:3000",
    "token": "bg_token_sec_...",
    "activeSessionId": null,
    "workstation": {
      "provider": "lmstudio",
      "model": "local-model",
      "temperature": 0.1,
      "maxTokens": 1024,
      "sanitizeEnabled": true
    }
  }
}
```

---

### `GET /api/llm/models`
Scans local machine for running Ollama and LM Studio model weights.

**Response `200 OK`**:
```json
{
  "ollama": {
    "online": true,
    "models": [
      {
        "name": "qwen2.5-coder:7b",
        "size": "4.7 GB",
        "modifiedAt": "2026-10-30T10:14:02.112Z"
      }
    ]
  },
  "lmstudio": {
    "online": true,
    "models": [
      {
        "name": "Meta-Llama-3.1-8B-Instruct-GGUF",
        "ownedBy": "lmstudio"
      }
    ]
  }
}
```

---

### `POST /api/llm/test`
Validates connectivity and response latency for a chosen model provider.

**Request Body**:
```json
{
  "provider": "ollama"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "target": "ollama",
  "details": "Connected. 1 models found."
}
```

---

## 3.3 AI Diagnostic & Analysis APIs

### `POST /api/solve` (or `POST /api/debug/solve`)
Comprehensive AI analysis returning root cause, code fix, explanation, complexity, and call tree.

**Request Body**:
```json
{
  "error": "TypeError: Cannot read properties of undefined (reading 'map')",
  "stackTrace": "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:42:18)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)",
  "language": "javascript",
  "framework": "react",
  "file": "src/components/UserList.jsx"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "errorType": "TypeError",
  "severity": "high",
  "language": "javascript",
  "framework": "react",
  "summary": "Attempted to dereference or access a property on an uninitialized (undefined/null) object.",
  "rootCause": "Target payload/state variable is evaluated before initialization or data fetch completion.",
  "confidence": 0.95,
  "relatedPatterns": [
    "State Uninitialized Read",
    "Null Safety Failure",
    "Optional Chaining Requirement"
  ],
  "solution": {
    "description": "Apply optional chaining and default empty initial state.",
    "code": "// Safe guarded access:\nif (!targetObject) return <LoadingSpinner />;\nconst items = targetObject?.items?.map(i => i.id) ?? [];"
  },
  "fixDiff": "--- a/src/components/UserList.jsx\n+++ b/src/components/UserList.jsx\n@@ -40,3 +40,4 @@\n-  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n+  const safeUsers = Array.isArray(users) ? users : [];\n+  return <ul>{safeUsers.map(u => <li key={u.id}>{u.name}</li>)}</ul>;",
  "explanation": "Replaced direct unsafe property access with optional chaining (?.) and a nullish coalescing default fallback (??).",
  "sideEffects": "None. Safe fallback ensures application handles empty, loading, or unauthenticated states gracefully.",
  "considerations": "Ensure caller component handles the loading or fallback state gracefully.",
  "meaning": "The JavaScript runtime attempted to access a property or method on an uninitialized reference (null or undefined).",
  "likelyCause": "Component rendered before asynchronous API fetch resolved, or state initialized without default value.",
  "concepts": [
    "Optional Chaining (?.)",
    "Nullish Coalescing (??)",
    "Defensive Programming",
    "Asynchronous Mount Invariant"
  ],
  "nextSteps": [
    "Inspect the line referenced in the stack trace for uninitialized data access.",
    "Verify that async promises or hooks complete before attempting to read nested properties.",
    "Initialize state variables with sensible empty defaults (e.g. [] instead of undefined)."
  ],
  "optimization": {
    "performance": "Eliminates application crashes and prevents unhandled process exits.",
    "complexity": "Time: O(N) | Space: O(1)",
    "security": "Guards against parameter tampering and unhandled exception leakage.",
    "maintainability": "Follows standard safe production coding practices."
  },
  "additionalContextRequired": false
}
```

---

### `POST /api/explain` (or `POST /api/debug/explain`)
Generates plain-English technical breakdown of complex error output.

**Request Body**:
```json
{
  "error": "Database Error: syntax error at or near \"DROP\"",
  "stackTrace": "at Client._query (node_modules/pg/lib/client.js:527:17)\n    at AuthService.authenticate (src/services/auth.js:89:22)"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "summary": "Database query failed or contains unescaped user input parameter.",
  "meaning": "An operation was attempted on an invalid reference or unhandled database driver execution frame.",
  "location": "src/services/auth.js:89",
  "likelyCause": "SQL query was constructed via unescaped string concatenation without parameterized placeholders.",
  "concepts": [
    "Parameterized Queries",
    "SQL Injection Mitigation (CWE-89)",
    "Prepared Statements",
    "Input Sanitization"
  ],
  "nextSteps": [
    "Refactor raw SQL string concatenation to parameterized binding ($1, $2 placeholders).",
    "Audit all database access methods for raw input interpolation.",
    "Implement automated unit tests with adversarial input payloads to verify syntax safety."
  ]
}
```

---

### `POST /api/fix` (or `POST /api/debug/fix`)
Generates concrete git-compatible diff patches with side-effect warnings.

**Request Body**:
```json
{
  "error": "FATAL ERROR: JavaScript heap out of memory",
  "stackTrace": "at processHugeBuffer (src/processors/stream.js:12:20)\n    at v8::ReportOOMFailure"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "summary": "Generated chunked streaming pipeline diff patch.",
  "rootCause": "Synchronous unconstrained buffer accumulation exceeded maximum V8 heap threshold (~1.4GB - 2GB).",
  "fixDiff": "--- a/src/processors/stream.js\n+++ b/src/processors/stream.js\n@@ -12,4 +12,6 @@\n-  const data = await fs.readFile(largeFile);\n-  return processAll(data);\n+  // Stream chunks instead of loading entire file into memory\n+  const stream = fs.createReadStream(largeFile, { highWaterMark: 64 * 1024 });\n+  for await (const chunk of stream) {\n+    yield processChunk(chunk);\n+  }",
  "explanation": "Replaced blocking synchronous in-memory file read with a chunked Stream reader, reducing memory footprint to O(1) buffer space.",
  "sideEffects": "Downstream consumer must consume data asynchronously via async generator or stream pipeline.",
  "considerations": "Ensure calling handler supports streaming chunk delivery without buffering."
}
```

---

### `POST /api/session` (or `POST /api/debug/session`)
Manages stateful multi-turn conversational debugging sessions.

**Request Body**:
```json
{
  "sessionId": "sess_491823",
  "message": "The UserList component is crashing only when the API returns an empty array.",
  "context": {
    "framework": "react",
    "component": "UserList"
  }
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "sessionId": "sess_491823",
  "reply": "If the error occurs only when the API returns an empty array, check if your reducer or mapping function expects at least one element (such as accessing `users[0].id`). Ensure you check `users.length > 0` before indexing, or provide fallback defaults.",
  "additionalContextRequired": false
}
```

---

## 3.4 Universal Workstation Execution API

### `POST /api/command`
The unified multiplexing endpoint powering the Cyberpunk Terminal HUD and standalone client applications. Automatically routes `solve`, `explain`, `fix`, `tree`, `blast-radius`, `similarity`, `cve`, `triage`, and `benchmark`.

**Request Body**:
```json
{
  "command": "solve",
  "trace": "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:42:18)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "provider": "offline_heuristic",
  "model": "heuristic-knowledge-engine",
  "latencyMs": 92,
  "tokenCount": 312,
  "tokPerSec": "55.4",
  "rawResponse": null,
  "sanitized": true,
  "callTree": {
    "errorTitle": "TypeError: Cannot read properties of undefined (reading 'map')",
    "culprit": {
      "order": 1,
      "fn": "UserList",
      "file": "src/components/UserList.jsx",
      "line": 42,
      "col": 18,
      "isUserCode": true,
      "role": "culprit",
      "snippet": "users.map(u => <li key={u.id}>{u.name}</li>)"
    },
    "frames": [
      {
        "order": 1,
        "fn": "UserList",
        "file": "src/components/UserList.jsx",
        "line": 42,
        "col": 18,
        "isUserCode": true,
        "role": "culprit"
      },
      {
        "order": 2,
        "fn": "renderWithHooks",
        "file": "node_modules/react-dom/cjs/react-dom.development.js",
        "line": 14985,
        "col": 18,
        "isUserCode": false,
        "role": "framework"
      }
    ],
    "blastRadius": {
      "culpritFile": "src/components/UserList.jsx:42",
      "affectedComponents": [
        "src/components/UserList.jsx"
      ],
      "scope": "Application Source Code Boundary",
      "severity": "HIGH",
      "impact": "Execution pipeline halted. Downstream consumer components received unhandled rejection."
    },
    "asciiTree": "🔴 [CRASH ROOT] TypeError: Cannot read properties of undefined (reading 'map')\n ├── 🎯 [CULPRIT] src/components/UserList.jsx:42 -> UserList()\n └── 📦 [FRAMEWORK] node_modules/react-dom/cjs/react-dom.development.js:14985 -> renderWithHooks()\n └── 💥 [BLAST RADIUS] Execution pipeline halted. Downstream consumer components received unhandled rejection. (Severity: HIGH)\n"
  },
  "structured": {
    "success": true,
    "engine": "Heuristic Knowledge Engine (Offline Mode)",
    "model": "built-in-knowledge-graph",
    "command": "solve",
    "errorType": "TypeError (Unsafe Null Property Dereference)",
    "language": "javascript",
    "rootCause": "Attempted property access (.map, .id, or nested key) on an undefined object before asynchronous data resolution completed.",
    "explanation": "In JavaScript/TypeScript, dereferencing properties on undefined or null causes an immediate fatal runtime throw. Guard against null or provide default values.",
    "diffPatch": "--- a/src/components/UserList.jsx\n+++ b/src/components/UserList.jsx\n@@ -38,7 +38,8 @@\n-  return (\n-    <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>\n+  // Guard against undefined collections before rendering\n+  const safeUsers = Array.isArray(users) ? users : [];\n+  return (\n+    <ul>{safeUsers.map(u => <li key={u.id}>{u.name}</li>)}</ul>\n   );",
    "complexity": {
      "time": "O(N)",
      "space": "O(1)",
      "rationale": "Safe array traversal requires single pass over N items with zero memory allocation."
    },
    "suggestedFix": "Implement boundary validation and defensive guards before executing the sensitive operation.",
    "graphContext": {
      "matchedPattern": "CVE-CWE-476 / Null Pointer Dereference",
      "historicalFixes": 14,
      "confidenceScore": "98.4%",
      "neo4jNodeId": "pattern_node_8492"
    }
  }
}
```

---

## 3.5 Knowledge Graph & Intelligence Endpoints

### Blast Radius Computation
Calculated via `computeBlastRadius(traceText)`:
```json
{
  "rootError": "CWE-89 SQL Injection / Query Syntax Fault",
  "culprit": "src/services/auth.js:89:22 -> AuthService.authenticate()",
  "riskScore": 96,
  "severity": "CRITICAL",
  "affectedServices": [
    "database-cluster",
    "auth-service",
    "user-records",
    "payment-gateway"
  ],
  "cascadeRisk": "Database query abortion, potential table exfiltration, connection lock",
  "circuitBreaker": "Migrate to parameterized prepared statement ($1, $2 placeholders)",
  "totalNodesImpacted": 6
}
```

### Pattern Similarity Clustering
Calculated via `computeSimilarityCluster(traceText)`:
```json
{
  "clusterName": "SEC-SQL-89 // Raw String Interpolation Query Anti-pattern",
  "fingerprint": "sha256:1a84f3c091adbb23774819aa018249de",
  "similarityPercent": 98.2,
  "historicalIncidents": 89,
  "verifiedFixPattern": "Parameterized SQL Statement ($1, $2 placeholders) with bind parameters",
  "mttrImprovement": "95% faster MTTR",
  "relatedPatterns": [
    "CWE-89 SQLi",
    "Dynamic Where Clause Concat",
    "Unescaped User Input"
  ]
}
```

### Security & CVE Threat Auditing
Calculated via `auditSecurityVulnerability(traceText)`:
```json
{
  "cweId": "CWE-89",
  "title": "Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)",
  "owasp": "A03:2021 - Injection",
  "cvssScore": 9.8,
  "severity": "CRITICAL",
  "exploitability": "High (Remote, Unauthenticated)",
  "remediation": "Use parameterized queries, prepared statements, or an abstraction ORM layer with bound variables.",
  "safeCodeSample": "const res = await db.query(\"SELECT * FROM users WHERE id = $1\", [userId]);"
}
```

### Complexity & Algorithmic Benchmarking
Calculated via `analyzeComplexity(traceText)`:
```json
{
  "currentPattern": "Synchronous In-Memory Buffer Accumulation",
  "currentTimeComplexity": "O(N) with full V8 Old Gen allocation lock",
  "currentSpaceComplexity": "O(N) unconstrained heap buffer accumulation (Exceeds 1.4GB)",
  "optimizedPattern": "Chunked Streaming Pipeline (stream.Readable / pipeline)",
  "optimizedTimeComplexity": "O(N) interleaved streaming without event-loop lag",
  "optimizedSpaceComplexity": "O(1) constant backpressure buffer footprint (~64KB)",
  "latencyGain": "Eliminates fatal crash; unlocks 85% lower peak memory usage",
  "gcImpact": "Near-zero major mark-sweep pauses; V8 heap remains flat"
}
```

---

## 3.6 Security & Anti-Tamper APIs

### `GET /api/security/status`
Returns whether current client IP or session is currently locked out.

**Response `200 OK` (Normal State)**:
```json
{
  "isSuspended": false,
  "remainingMs": 0
}
```

**Response `200 OK` (Suspended State)**:
```json
{
  "isSuspended": true,
  "remainingMs": 84192000,
  "lock": {
    "incidentId": "SEC-918231",
    "active": true,
    "lockedAt": 1794218400000,
    "unlockAt": 1794304800000,
    "durationMs": 86400000,
    "reason": "Attempted to bypass or tamper with BugGraph security / sanitization measures",
    "category": "SECURITY_MEASURE_BYPASS",
    "trigger": "bypass-security --force-unmask",
    "clientId": "127.0.0.1"
  }
}
```

---

### `POST /api/security/reset`
Emergency unlock endpoint to clear active suspension locks.

**Request Body**:
```json
{
  "key": "<DEVELOPER_OVERRIDE_KEY>"
}
```

**Response `200 OK` (Valid Key)**:
```json
{
  "success": true,
  "message": "All security suspensions cleared successfully"
}
```

**Response `403 Forbidden` (Invalid Key)**:
```json
{
  "success": false,
  "error": "Invalid developer override key"
}
```

---

## 3.7 Bug Ingestion & Ledger APIs

### `POST /api/bugs` (or `/api/log`)
Ingests a bug report into the central graph ledger.

**Request Body**:
```json
{
  "title": "Unhandled promise rejection in worker-pool queue",
  "severity": "critical",
  "component": "worker-pool",
  "stackTrace": "Error: Worker process exited unexpectedly\n    at WorkerPool.dispatch (src/pool.js:84)"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "bug_local_k8f92a",
    "title": "Unhandled promise rejection in worker-pool queue",
    "severity": "critical",
    "component": "worker-pool",
    "createdAt": "2026-11-11T12:00:00.000Z"
  }
}
```

---

### `POST /api/sanitize`
Scrubs API keys, passwords, and tokens from input text.

**Request Body**:
```json
{
  "text": "Connect with postgres://admin:secretPass123@db.prod.internal:5432/main and token sk-1234567890abcdef1234567890"
}
```

**Response `200 OK`**:
```json
{
  "original": "Connect with postgres://admin:secretPass123@db.prod.internal:5432/main and token sk-1234567890abcdef1234567890",
  "sanitized": "Connect with postgres://[REDACTED_USER]:[REDACTED_PASS]@db.prod.internal:5432/main and token [REDACTED_SECRET]",
  "modified": true
}
```

---

## 3.8 Web Installer & Clean Distribution Endpoints

| Endpoint | Method | Output Type | Description |
|---|---|---|---|
| `/install.sh` | `GET` | `text/x-shellscript` | Dynamic Bash/Zsh one-line installer script for Linux & macOS. |
| `/install.ps1` | `GET` | `text/plain` | Dynamic PowerShell one-line installer script for Windows. |
| `/install` | `GET` | `text/plain` | Plaintext installation guide. |
| `/api/install/package.tar.gz` | `GET` | `application/gzip` | Clean production distribution tarball (excludes `node_modules`, `.git`, `*.log`, `*.txt`). |

---

# 4. Frontend Mock Data Replacement Guide

When updating mock datasets, state fixtures, or test mocks in the frontend website, replace generic placeholder strings with the authentic BugGraph schemas below.

## 4.1 Scenario A: React Nullish Dereference (TypeError)

```json
{
  "id": "scenario_react_typeerror",
  "command": "solve",
  "trace": "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.jsx:42:18)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14985:18)",
  "errorType": "TypeError",
  "severity": "high",
  "language": "javascript",
  "framework": "react",
  "culprit": {
    "file": "src/components/UserList.jsx",
    "line": 42,
    "function": "UserList()",
    "snippet": "users.map(u => <li key={u.id}>{u.name}</li>)"
  },
  "summary": "Attempted to dereference or access a property on an uninitialized (undefined/null) object.",
  "rootCause": "Target payload/state variable is evaluated before initialization or data fetch completion.",
  "confidenceScore": "98.4%",
  "complexity": {
    "current": "O(N) interrupted by unhandled throw",
    "optimized": "Time: O(N) | Space: O(1)",
    "gain": "Eliminates render crash and avoids expensive DOM unmount/remount cycles (~120ms saved)"
  },
  "diff": "--- a/src/components/UserList.jsx\n+++ b/src/components/UserList.jsx\n@@ -38,7 +38,8 @@\n-  return (\n-    <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>\n+  // Guard against undefined collections before rendering\n+  const safeUsers = Array.isArray(users) ? users : [];\n+  return (\n+    <ul>{safeUsers.map(u => <li key={u.id}>{u.name}</li>)}</ul>\n   );",
  "affectedNodes": [
    "frontend-renderer",
    "user-profile-view",
    "client-session"
  ]
}
```

---

## 4.2 Scenario B: SQL Injection / Syntax Fault (CWE-89)

```json
{
  "id": "scenario_sql_injection",
  "command": "solve",
  "trace": "Database Error: syntax error at or near \"DROP\"\n    Query: SELECT * FROM accounts WHERE username = 'admin' OR '1'='1' AND role = 'user'\n    at Client._query (node_modules/pg/lib/client.js:527:17)\n    at AuthService.authenticate (src/services/auth.js:89:22)",
  "errorType": "Database Syntax & SQL Injection Fault",
  "cwe": "CWE-89",
  "owasp": "A03:2021 - Injection",
  "cvssScore": 9.8,
  "severity": "critical",
  "language": "sql/javascript",
  "culprit": {
    "file": "src/services/auth.js",
    "line": 89,
    "function": "AuthService.authenticate()",
    "snippet": "const query = \"SELECT * FROM accounts WHERE username = '\" + username + \"'\";"
  },
  "summary": "Database query was constructed via unescaped string concatenation, creating a severe injection vulnerability.",
  "rootCause": "User input parameter was interpolated directly into SQL command without query parameterization.",
  "confidenceScore": "99.1%",
  "complexity": {
    "current": "O(N) Full Table Scan + query plan re-parse",
    "optimized": "Time: O(log N) | Space: O(1)",
    "gain": "Reuses cached query plan; drops query latency from 450ms to 4ms (112x speedup)"
  },
  "diff": "--- a/src/services/auth.js\n+++ b/src/services/auth.js\n@@ -85,5 +85,5 @@\n-  const query = \"SELECT * FROM accounts WHERE username = '\" + username + \"'\";\n-  return await db.query(query);\n+  // Use parameterized query placeholders ($1, $2)\n+  const query = 'SELECT * FROM accounts WHERE username = $1 AND role = $2';\n+  return await db.query(query, [username, role]);",
  "affectedNodes": [
    "database-cluster",
    "auth-service",
    "user-records",
    "payment-gateway"
  ]
}
```

---

## 4.3 Scenario C: Node.js V8 Heap Out Of Memory (OOM)

```json
{
  "id": "scenario_v8_heap_oom",
  "command": "solve",
  "trace": "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n    1: 0xb09c30 node::Abort() [node]\n    at processHugeBuffer (src/processors/stream.js:12:20)",
  "errorType": "JavaScript Heap Out Of Memory",
  "severity": "critical",
  "language": "javascript/node",
  "culprit": {
    "file": "src/processors/stream.js",
    "line": 12,
    "function": "processHugeBuffer()",
    "snippet": "const data = await fs.readFile(largeFile);"
  },
  "summary": "Process exceeded maximum V8 heap threshold due to unbounded buffer accumulation.",
  "rootCause": "Entire file loaded synchronously into V8 old generation space without backpressure streaming.",
  "confidenceScore": "96.5%",
  "complexity": {
    "current": "O(N) unconstrained memory allocation (> 1.4GB peak)",
    "optimized": "Time: O(N) | Space: O(1)",
    "gain": "Flat 64KB constant memory consumption; zero major GC freeze pauses"
  },
  "diff": "--- a/src/processors/stream.js\n+++ b/src/processors/stream.js\n@@ -12,4 +12,6 @@\n-  const data = await fs.readFile(largeFile);\n-  return processAll(data);\n+  // Stream chunks instead of loading entire file into memory\n+  const stream = fs.createReadStream(largeFile, { highWaterMark: 64 * 1024 });\n+  for await (const chunk of stream) {\n+    yield processChunk(chunk);\n+  }",
  "affectedNodes": [
    "worker-pool",
    "background-ingestion",
    "queue-consumer"
  ]
}
```

---

## 4.4 Scenario D: Upstream Connection Timeout (Network Fault)

```json
{
  "id": "scenario_network_timeout",
  "command": "solve",
  "trace": "FetchError: request to http://billing-api.internal/v1/charge failed, reason: connect ETIMEDOUT 10.0.4.15:8080\n    at ClientRequest.<anonymous> (node_modules/node-fetch/lib/index.js:1491:11)\n    at fetchWithRetry (src/api/client.js:34:10)",
  "errorType": "Upstream Service Timeout / ETIMEDOUT",
  "severity": "medium",
  "language": "javascript",
  "culprit": {
    "file": "src/api/client.js",
    "line": 34,
    "function": "fetchWithRetry()",
    "snippet": "const res = await fetch(endpoint);"
  },
  "summary": "Upstream billing service connection timed out after socket inactivity threshold.",
  "rootCause": "Lack of client-side circuit-breaker tripwire and jittered exponential backoff.",
  "confidenceScore": "94.0%",
  "complexity": {
    "current": "Unbounded thread pool blocking during network stalls",
    "optimized": "Bounded timeout with exponential jitter backoff",
    "gain": "Frees socket pool in 500ms rather than hanging for default 30,000ms"
  },
  "diff": "--- a/src/api/client.js\n+++ b/src/api/client.js\n@@ -33,3 +33,5 @@\n-  const res = await fetch(endpoint);\n-  return res.json();\n+  // Implement bounded timeout with abort controller\n+  const controller = new AbortController();\n+  const id = setTimeout(() => controller.abort(), 4000);\n+  const res = await fetch(endpoint, { signal: controller.signal });\n+  clearTimeout(id);\n+  return res.json();",
  "affectedNodes": [
    "api-gateway",
    "downstream-clients",
    "billing-service-proxy"
  ]
}
```

---

## 4.5 Scenario E: Security Violation Lockout (423 Locked)

```json
{
  "status": 423,
  "error": "Critical Security Violation Detected: Circumvention of security measures attempted.",
  "suspended": true,
  "remainingMs": 86394210,
  "lock": {
    "incidentId": "SEC-741982",
    "active": true,
    "lockedAt": 1794218400000,
    "unlockAt": 1794304800000,
    "durationMs": 86400000,
    "reason": "Attempted destructive system command execution or shell injection",
    "category": "SYSTEM_COMMAND_INJECTION",
    "trigger": "rm -rf /var/data",
    "clientId": "127.0.0.1"
  }
}
```

---

# 5. Data Sanitization & Secret Scrubbing Standards

The workstation automatically executes regex redaction via [`src/sanitizer.js`](file:///c:/VOLUME%20D/AI-Powered-Bug-Pattern-Backend/src/sanitizer.js) on all inputs before transmitting logs to any model or ledger:

| Target Credential | Regex Match Pattern | Replacement Output |
|---|---|---|
| **OpenAI / Anthropic Keys** | `sk-[a-zA-Z0-9_-]{20,}` | `[REDACTED_SECRET]` |
| **Google Gemini API Keys** | `AIzaSy[a-zA-Z0-9_-]{30,35}` | `[REDACTED_SECRET]` |
| **AWS Access Key ID** | `AKIA[0-9A-Z]{16}` | `[REDACTED_SECRET]` |
| **Bearer Tokens** | `Bearer\s+[a-zA-Z0-9\._\-]{20,}` | `Bearer [REDACTED_SECRET]` |
| **JWT Tokens** | `eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}` | `[REDACTED_SECRET]` |
| **Database Connection URIs** | `(mongodb\|postgres\|mysql\|redis)://([^:]+):([^@]+)@` | `$1://[REDACTED_USER]:[REDACTED_PASS]@` |
| **Generic Passwords / Secrets** | `(api_key\|secret\|password\|auth_token)\s*[:=]\s*["']?([^\s"']+)["']?` | `$1=[REDACTED_SECRET]` |
| **RSA Private Key Blocks** | `-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----` | `[REDACTED_SECRET]` |

