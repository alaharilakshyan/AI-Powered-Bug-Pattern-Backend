# Implementation Plan: AI-Powered BugGraph CLI & Backend Debugging Workstation

> **Specification Reference**: `backen_guide.md`  
> **Role**: Member 3 — Local Workstation Tool Developer (`buggraph-cli`) & API Integration  
> **Repository**: `AI-Powered-Bug-Pattern-Backend` (Branch: `feature/cli-workstation`)  
> **Target Endpoints**: BugGraph Gateway (`/api/bugs` & `/api/debug/*`)

---

## 🎯 Core Product Vision Alignment

Transform `buggraph-cli` from a simple **bug storage client** into an **AI-powered developer debugging workstation**.

Instead of merely:
> *"Store this bug report in the database."*

The CLI & Backend will now execute:
> *"Understand this error log, analyze root causes using knowledge-graph context, generate concrete code fixes, evaluate time/space complexity, and work with the developer interactively."*

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Local Workstation (buggraph-cli)
        A[Input: Copy/Paste | Stdin Pipe | File] --> B[Input Reader & Multiline Buffer]
        B --> C{CLI Command Router}
        C -->|solve| D1[Solve Handler]
        C -->|explain| D2[Explain Handler]
        C -->|fix| D3[Fix Handler]
        C -->|debug| D4[Interactive Session Handler]
        C -->|log / pipe| D5[Legacy Ingestion Handler]
    end
    
    subgraph BugGraph Central Backend
        E[Auth Middleware & Rate Limiter]
        D1 & D2 & D3 & D4 & D5 -->|Bearer Token + JSON Payload| E
        E --> F[Debug Controller]
        F --> G[Stack Trace Parser & Error Classifier]
        G --> H[(Neo4j Knowledge Graph)]
        H -->|Historical Bugs & Fixes| I[Context Builder]
        I --> J[LLM Diagnosis Engine]
        J --> K[Solution Optimizer & Evaluator]
        K -->|Structured JSON Response| L[CLI UI Formatter (chalk/boxen)]
    end
```

---

## 🛠️ Extended CLI Command Matrix

| Command | UX / Input | Primary Purpose | Key Output |
|---|---|---|---|
| `buggraph auth <token>` | CLI Arg | Persist developer auth key in `~/.buggraph/config.json` | Token Validation Status |
| `buggraph status` | Exec | Check backend API connection, token validity, and AI state | System Health |
| `buggraph log` | Form / Flags | Ingest and persist a bug report into the Knowledge Graph | Bug Ingestion ID |
| `buggraph pipe` | Stdin | Continuous stream pipe ingestion for CI/CD pipelines | Automated Ingest Log |
| `buggraph solve` **[NEW]** | Paste / Pipe / File | Comprehensive error analysis + root cause + fix + complexity evaluation | Root Cause + Fix + $O(n)$ Complexity |
| `buggraph explain` **[NEW]** | Paste / Pipe / File | Educational plain-English breakdown of what an error means | Error Meaning + Location + Concepts |
| `buggraph fix` **[NEW]** | Paste / Pipe / File | Direct code patch generator with diffs and side-effect warnings | Code Diff + Explanation + Security |
| `buggraph debug` **[NEW]** | Interactive Prompt | Stateful multi-turn debugging chat (requests missing context) | Conversational AI Debug Session |

---

## 📥 Multiline Input Engine (`src/input.js`)

The CLI will support three distinct input modes across all AI debugging commands:

1. **Copy/Paste Mode** (`buggraph solve`):
   - Opens a clean terminal buffer:
     ```text
     ┌──────────────────────────────────────────────────────────┐
     │ BugGraph AI Debugger                                     │
     │ Paste your stack trace / error below. Press Ctrl+D to submit. │
     └──────────────────────────────────────────────────────────┘
     ```
   - Captures multiline paste until `EOF` (`Ctrl+D`) or double newline sequence.
2. **Stdin Pipe Mode** (`npm test 2>&1 | buggraph solve`):
   - Automatically detects non-TTY stdin streams, buffers raw log chunks up to token limit, and submits without prompt blocking.
3. **File Input Mode** (`buggraph solve --file error.log`):
   - Reads target log file directly from disk.

---

## 🌐 API Endpoints & Structured Data Contracts

### 1. `POST /api/debug/solve`
**Request Payload**:
```json
{
  "error": "TypeError: Cannot read properties of undefined (reading 'map')",
  "stackTrace": "at UserList.jsx:42:15...",
  "language": "javascript",
  "framework": "react",
  "component": "user-list",
  "file": "UserList.jsx"
}
```

**Response Schema** (Enforced JSON for CLI formatting):
```json
{
  "success": true,
  "errorType": "TypeError",
  "severity": "medium",
  "language": "javascript",
  "framework": "react",
  "summary": "Attempted to invoke map() on an undefined state object during initial component mount.",
  "rootCause": "The 'users' state variable is initialized as undefined instead of an empty array [], causing render failure before API fetch resolves.",
  "confidence": 0.94,
  "relatedPatterns": ["State Uninitialized Read", "Async Render Timing"],
  "solution": {
    "description": "Initialize state with default empty array [] and add optional chaining.",
    "code": "const [users, setUsers] = useState([]);\n// Or safely access in JSX:\n{users?.map(user => <UserCard key={user.id} user={user} />)}"
  },
  "optimization": {
    "performance": "Prevents immediate client runtime crashes and unhandled JS exceptions.",
    "complexity": "Time: O(N) | Space: O(N)",
    "security": "Clean null protection",
    "maintainability": "Standard React hooks safety pattern"
  },
  "additionalContextRequired": false
}
```

---

## 🎨 Terminal UI Formatter (`src/ui/formatter.js`)

The CLI will process structured backend JSON and render high-contrast, beautiful terminal layouts:

```text
🔍 ANALYSIS
───────────
Error    : TypeError: Cannot read properties of undefined (reading 'map')
Location : UserList.jsx:42
Pattern  : State Uninitialized Read (Confidence: 94%)

🎯 ROOT CAUSE
─────────────
The 'users' state variable is initialized as undefined instead of an empty array [].

🛠️ RECOMMENDED FIX
──────────────────
const [users, setUsers] = useState([]);

⚡ OPTIMIZATION & COMPLEXITY
────────────────────────────
• Time Complexity  : O(N)
• Space Complexity : O(N)
• Safety           : Prevents client runtime crash on cold mount
```

---

## 🚨 Security & Non-Interactive CI Support

1. **Secret Redaction**:
   - Local CLI sanitizer (`src/utils/sanitizer.js`) redacts obvious API keys (`sk-...`, Bearer tokens, DB URIs) before transmitting logs to backend.
2. **CI Non-Interactive Mode**:
   - Passing `--non-interactive` or `--json` prevents TTY prompt blocking:
     ```bash
     npm test 2>&1 | buggraph solve --non-interactive --json
     ```
3. **Session Persistence (`buggraph debug`)**:
   - Stores active debug session ID in local memory to allow multi-turn context (`/api/debug/session`).

---

## 📋 Proposed Changes & File Plan

### Component 1: `buggraph-cli` Package Core
#### [NEW] [package.json](file:///d:/AI-Powered-Bug-Pattern-Backend/package.json)
- Includes `commander`, `inquirer`, `chalk`, `boxen`, `ora`, `axios`, `conf`.

#### [NEW] [bin/buggraph.js](file:///d:/AI-Powered-Bug-Pattern-Backend/bin/buggraph.js)
- Global CLI entry point routing `auth`, `status`, `log`, `pipe`, `solve`, `explain`, `fix`, `debug`.

---

### Component 2: CLI Utilities & Input Modules
#### [NEW] [src/config.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/config.js)
- Reads/writes `~/.buggraph/config.json` for token and base endpoint URL.

#### [NEW] [src/input.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/input.js)
- Unified multiline Copy/Paste reader, Stdin pipe stream buffer, and file reader.

#### [NEW] [src/sanitizer.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/sanitizer.js)
- Regex-based secret & credentials redactor.

#### [NEW] [src/api.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/api.js)
- Axios HTTP client wrapping `/api/bugs` and `/api/debug/*` endpoints.

#### [NEW] [src/ui/formatter.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/ui/formatter.js)
- Structured JSON to terminal UI layout renderer (`chalk` + `boxen`).

---

### Component 3: Command Handlers
#### [NEW] [src/commands/solve.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/commands/solve.js)
- Handles `buggraph solve` workflow.

#### [NEW] [src/commands/explain.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/commands/explain.js)
- Handles `buggraph explain` workflow.

#### [NEW] [src/commands/fix.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/commands/fix.js)
- Handles `buggraph fix` workflow.

#### [NEW] [src/commands/debug.js](file:///d:/AI-Powered-Bug-Pattern-Backend/src/commands/debug.js)
- Handles multi-turn `buggraph debug` interactive session.

---

## 🧪 Verification Plan

### Automated Tests
1. Run `npm test` verifying input multiline buffer parsing (`Ctrl+D` and piping).
2. Sanitizer tests ensuring sensitive keys are scrubbed before payload transmission.
3. Formatter tests confirming structured JSON outputs translate to valid terminal strings.

### Manual Verification
1. `npm link` local executable installation.
2. `buggraph solve` with multiline copy-pasted error trace.
3. `cat sample.log | buggraph solve` with piped input.
4. Verify HTTP communication against backend mock API endpoints.
