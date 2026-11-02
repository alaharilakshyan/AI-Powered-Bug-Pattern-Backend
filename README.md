# BugGraph: AI-Powered Bug-Pattern Knowledge Graph Workstation & CLI

> **High-Performance Debugging Workstation**: Cyberpunk Terminal Workstation HUD, standalone CMD/REPL utility, anti-tamper security tripwires with 24-hour lockout protection, offline zero-latency heuristic AI engine, and zero-dump web installation scripts.

---

## ⚡ How to Run the Tool

### 1. Graphical Terminal Workstation HUD (Separated Window Mode)
```bash
# Option 1: Via npm script (Foreground)
npm run pop

# Option 2: Detached Background Mode (Frees your terminal immediately!)
node bin/buggraph.js pop --detach

# Option 3: Double-click launch without opening any terminal at all:
# Double-click launch-buggraph.vbs or launch-buggraph.bat in the project folder
```
Starts the BugGraph workstation server at `http://127.0.0.1:4567` and automatically opens a dedicated standalone desktop HUD window docked comfortably beside your terminal (`1260x840`). In detached mode (`--detach`), your terminal is freed immediately.

### 2. Standalone CLI & Cyberpunk REPL Shell
```bash
# Interactive REPL shell mode
npm run shell
# or
node bin/buggraph.js shell

# Interactive selection menu
node bin/buggraph.js --cli

# Direct one-shot commands
node bin/buggraph.js solve "TypeError: Cannot read properties of undefined (reading 'map')"
node bin/buggraph.js explain "Database Error: syntax error at or near DROP"
node bin/buggraph.js fix "FATAL ERROR: JavaScript heap out of memory"
node bin/buggraph.js blast-radius "Database Error"
node bin/buggraph.js similarity "TypeError: Cannot read properties of undefined"
node bin/buggraph.js cve "Query syntax error at or near DROP"
node bin/buggraph.js triage "Database connection timeout after 30000ms"
node bin/buggraph.js benchmark "Heavy loop processing 100000 items"
node bin/buggraph.js rules
node bin/buggraph.js audit
node bin/buggraph.js install
```

---

## 🌐 Official Web Installation (When Hosted on Server)

When hosted on your domain or local network, users can install the BugGraph CLI utility directly by running a single command line:

### • Linux / macOS (Bash / Zsh):
```bash
curl -fsSL http://127.0.0.1:4567/install.sh | bash
```

### • Windows (PowerShell):
```powershell
irm http://127.0.0.1:4567/install.ps1 | iex
```

### • Node.js Global (npm):
```bash
npm install -g ./
```

### 🔒 Clean Installation Guarantee (No Dupe / Dump Files)
* Downloads the official clean package tarball `/api/install/package.tar.gz` directly from the server.
* Installs clean files into `~/.buggraph` (or `%USERPROFILE%\.buggraph` on Windows).
* Symlinks the actual `buggraph` executable directly to user PATH.
* Automatically deletes download archives immediately with **zero duplicate or dump files**.
* Pre-configured with zero-latency heuristic AI so it works immediately without external setup.

---

## 🛡️ Usage Flexibility & 24-Hour Suspension Security Policy

The utility grants developers the flexibility to test errors, benchmarks, and settings, but enforces strict boundaries:

### ✔ Allowed / Flexible Experimentation:
* Testing arbitrary stack traces, custom error logs, and multi-line exception payloads.
* Running all diagnostic and patching commands: `solve`, `explain`, `fix`, `debug`, `tree`, `blast-radius`.
* Benchmarking offline heuristic zero-latency diagnosis and local LLMs (Ollama / LM Studio).
* Testing the secret scrubbing sanitizer on sensitive strings and connection credentials.

### ✖ Restricted / Tamper Attempts (Triggers 24-Hour Suspension):
* Attempting to bypass security guardrails, override sanitizers, or strip boundary protections (`bypass-security`, `override-sanitizer`, `unmask-all`).
* Destructive system command execution or shell injection (`rm -rf`, `format c:`, `del /f`, `cat /etc/shadow`).
* Path traversal probing beyond the permitted application directory (`../../`).
* Privilege escalation attempts (`sudo`, `root`, `admin-override`, `hack-system`).
* Arbitrary runtime code injection (`eval()`, `child_process`, reverse shells).

### 🚨 What Happens on Tamper Violation?
1. **Immediate Lockout**: Terminal activity and API execution are suspended for **24 continuous hours**.
2. **Warning Display**: An alarming red warning HUD overlay is rendered with incident ID, violation sample, policy details, and a live countdown timer.
3. **Persisted Lock**: Lockout state is saved on disk (`~/.buggraph/security_lock.json` / `.security_lock.json`) and in client state.
4. **Developer Emergency Unlock**: In emergencies, developers or teammates can unlock using:
   ```bash
   node bin/buggraph.js reset-security --key BUGGRAPH_DEV_OVERRIDE_2026
   ```

---

## ⌨️ Shell Commands Reference

| Command | Description |
| :--- | :--- |
| `pop` | Launches dedicated BugGraph Window Utility Workstation GUI outside terminal |
| `shell` | Launches interactive cyberpunk REPL shell with autocomplete & history |
| `solve [trace]` | Comprehensive analysis of error, root cause, code patch, and $O(N)$ complexity |
| `blast-radius [trace]` | Knowledge graph blast radius auditor & downstream cascade failure tree |
| `similarity [trace]` | Matches stack trace against historical bug pattern clusters |
| `cve [trace]` | Audits stack trace for CWE/CVE security risks, CVSS score & OWASP Top 10 |
| `triage [trace]` | Calculates priority tier (P0-P3), SLA target & generates ticket markdown |
| `benchmark [trace]` | Evaluates Big-O time/space complexity, GC churn & memory overhead |
| `patch-test [diff]` | Simulates and validates diff patch application safely |
| `sanitize [text]` | Scrubs API keys, passwords, bearer tokens & DB connection strings |
| `explain [trace]` | Translates compiler/runtime errors into plain technical terms |
| `fix [trace]` | Generates unified git patch diff (`diff -u`) |
| `debug [query]` | Interactive multi-turn debugging chat |
| `rules` | Displays usage flexibility limits and security boundary policy |
| `audit` | Displays active security shield and tamper protection status |
| `install` | Displays one-line terminal commands to install tool from web |
| `reset-security` | Emergency developer unlock (requires `--key <KEY>`) |
| `status` | Checks engine health, ping latency, and model status |

