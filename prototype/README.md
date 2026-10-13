# BugGraph Prototype: Terminal Workstation HUD & Free CMD Utility

> **Testing Sandbox**: Dedicated prototype sandbox with Cyberpunk Terminal HUD, standalone CMD-operated CLI utility, anti-tamper security tripwires with 24-hour lockout protection, and zero-dump web installation scripts.

---

## ⚡ How to Run the Tool

### 1. Graphical Terminal HUD (Desktop Window Mode)
```bash
# Option 1: Via npm script
npm run prototype

# Option 2: Directly via node
node prototype/run.js
```
Starts the prototype server at `http://127.0.0.1:4568` and automatically opens a dedicated standalone desktop HUD window (`1260x840`).

### 2. Standalone CMD / Terminal Utility (Free Edition)
```bash
# Interactive REPL mode
node prototype/cli.js
# Or via npm script:
npm run prototype:cli

# Direct one-shot commands
node prototype/cli.js solve "TypeError: Cannot read properties of undefined"
node prototype/cli.js explain "Query syntax error at or near DROP"
node prototype/cli.js fix "FATAL ERROR: Heap out of memory"
node prototype/cli.js tree "Database Error"
node prototype/cli.js rules
node prototype/cli.js install
node prototype/cli.js audit
```

---

## 🌐 Official Web Installation (When Hosted on Website)

When hosted on your domain or local network, users can install our actual BugGraph utility tool directly by pasting a single command line into their terminal:

### • Linux / macOS (Bash / Zsh):
```bash
curl -fsSL http://127.0.0.1:4568/install.sh | bash
```

### • Windows (PowerShell):
```powershell
irm http://127.0.0.1:4568/install.ps1 | iex
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

The prototype utility grants developers the flexibility to test errors, benchmarks, and settings, but enforces strict boundaries:

### ✔ Allowed / Flexible Experimentation:
* Testing arbitrary stack traces, custom error logs, and multi-line exception payloads.
* Running all diagnostic and patching commands: `solve`, `explain`, `fix`, `debug`, `tree`.
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
3. **Persisted Lock**: Lockout state is saved on disk (`prototype/.security_lock.json`) and in client state.
4. **Developer Emergency Unlock**: In emergencies, developers or teammates can unlock using:
   ```bash
   node prototype/cli.js reset-security --key BUGGRAPH_DEV_OVERRIDE_2026
   ```

---

## ⌨️ Shell Commands Reference

| Command | Description |
| :--- | :--- |
| `solve [trace]` | Comprehensive analysis of error, root cause, code patch, and $O(N)$ complexity |
| `tree [trace]` | Graphic tree visual representation of error call stack & affected files |
| `explain [trace]` | Translates compiler/runtime errors into plain technical terms |
| `fix [trace]` | Generates unified git patch diff (`diff -u`) |
| `debug [query]` | Interactive multi-turn debugging chat |
| `rules` | Displays usage flexibility limits and security boundary policy |
| `install` | Displays one-line terminal commands to install tool from web |
| `audit` | Displays active security shield and tamper protection status |
| `model` | Inspects or hot-swaps active LLM provider (`model scan`, `model set <name>`) |
| `status` | Checks engine health, ping latency, and model status |
| `sanitize [on\|off]` | Toggles regex secret scrubbing (API keys, passwords, DB URIs) |
| `temp <0.0 - 1.0>` | Changes LLM sampling temperature |
| `reset-security` | Emergency developer unlock (requires `--key <KEY>`) |
| `clear` or `Ctrl+L` | Clears terminal output stream |
| `help` | Displays command reference table |
