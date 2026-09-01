# BugGraph CLI — AI Debugging Extension Specification

## Objective

Extend `buggraph-cli` from a simple **bug/log submission CLI** into an **AI-powered developer debugging workstation**.

The CLI should allow developers and CI/CD pipelines to:

* Submit bugs and logs to BugGraph.
* Copy/paste errors directly into the terminal.
* Pipe compiler/test/runtime errors into BugGraph.
* Explain errors in simple terms.
* Identify probable root causes.
* Generate recommended fixes.
* Provide efficient and optimized solutions.
* Optionally interact with the AI step-by-step to debug complex problems.

The CLI remains a **client/bridge**. AI analysis, bug classification, knowledge retrieval, and solution generation should primarily happen on the **BugGraph backend**.

---

# 1. Core Concept

Current flow:

```text
Developer / CI
      ↓
buggraph-cli
      ↓
POST /api/bugs
      ↓
BugGraph Backend
      ↓
AI / Bug Graph
```

New flow:

```text
Developer / CI
      ↓
buggraph-cli
      ↓
BugGraph API
      ↓
Error Analysis
      ↓
Bug Pattern / Knowledge Graph Retrieval
      ↓
LLM
      ↓
Root Cause
      ↓
Recommended Fix
      ↓
Optimization / Validation
      ↓
Developer
```

The goal is to make BugGraph capable of going beyond:

> "Store this bug."

and support:

> "Understand this bug and help me solve it."

---

# 2. New CLI Capabilities

## Existing Commands

```bash
buggraph auth <token>
buggraph status
buggraph log
buggraph pipe
```

## New Commands

### `buggraph solve`

Interactive error-solving workflow.

```bash
buggraph solve
```

Developer pastes an error/stack trace and submits it.

Expected flow:

```text
Paste Error
    ↓
Analyze Error
    ↓
Identify Root Cause
    ↓
Search Related Bug Patterns
    ↓
Generate Solution
    ↓
Evaluate Solution
    ↓
Return Optimized Recommendation
```

---

### `buggraph explain`

Explain an error without necessarily generating a full fix.

```bash
buggraph explain
```

Output should include:

* What the error means.
* Where it occurred.
* Likely cause.
* Important technical concepts.
* What should be investigated next.

Useful for junior developers and learning.

---

### `buggraph fix`

Generate a concrete fix for an error.

```bash
buggraph fix
```

Output should include:

1. Root cause.
2. Problematic code/context if available.
3. Recommended fix.
4. Corrected code.
5. Explanation of why the fix works.
6. Potential side effects.
7. Performance/security considerations.

---

### `buggraph debug`

Interactive AI debugging session.

```bash
buggraph debug
```

The AI should be able to ask the developer for additional context when the initial error is insufficient.

Example:

```text
BugGraph:
I found a probable NullPointerException.

The stack trace is insufficient to determine the exact fix.

Please provide:
1. Relevant source code
2. Full stack trace
3. Recent changes
4. Continue with best-effort analysis
```

The developer can continue the conversation until the issue is understood/resolved.

---

# 3. Input Methods

The CLI should support **three major input methods**.

## A. Copy/Paste

Primary new UX:

```bash
buggraph solve
```

Terminal:

```text
┌──────────────────────────────────────┐
│ BugGraph AI Debugger                 │
│                                      │
│ Paste your error below.              │
│ Press Ctrl+D when finished.          │
└──────────────────────────────────────┘
```

The CLI reads multiline input.

---

## B. Pipe

Existing pipe functionality should also work with AI commands.

Examples:

```bash
cat error.log | buggraph solve
```

```bash
npm test 2>&1 | buggraph solve
```

```bash
npm run build 2>&1 | buggraph explain
```

This is important for CI/CD.

---

## C. File

Support direct file input:

```bash
buggraph solve --file error.log
```

Optional future support:

```bash
buggraph fix --file error.log
```

---

# 4. Backend Responsibility

The backend should become responsible for the actual intelligence.

The CLI should NOT contain the LLM logic.

Backend responsibilities:

```text
Receive Error
      ↓
Normalize Input
      ↓
Detect Language / Framework / Error Type
      ↓
Parse Stack Trace
      ↓
Classify Bug
      ↓
Search BugGraph / Knowledge Graph
      ↓
Retrieve Similar Bugs / Patterns
      ↓
Build LLM Context
      ↓
Generate Diagnosis
      ↓
Generate Solution
      ↓
Evaluate Solution
      ↓
Return Structured Response
```

---

# 5. Recommended Backend API Design

Existing:

```http
POST /api/bugs
GET /api/bugs
```

Keep these for bug submission/retrieval.

Add dedicated AI debugging endpoints.

Suggested:

```http
POST /api/debug/analyze
POST /api/debug/explain
POST /api/debug/solve
POST /api/debug/fix
POST /api/debug/session
```

The exact endpoint design should be evaluated before implementation.

---

# 6. Suggested Analyze Request

Example:

```json
{
  "error": "TypeError: Cannot read properties of undefined (reading 'map')",
  "stackTrace": "at UserList.jsx:42...",
  "language": "javascript",
  "framework": "react",
  "component": "user-list",
  "sourceCode": "...optional...",
  "context": "...optional...",
  "environment": "...optional..."
}
```

Not every field should be required.

The backend should gracefully handle minimal input such as:

```json
{
  "error": "NullPointerException at UserService.java:84"
}
```

---

# 7. Structured AI Response

Avoid returning only plain text.

The backend should ideally return structured JSON:

```json
{
  "errorType": "TypeError",
  "severity": "medium",
  "language": "javascript",
  "framework": "react",
  "summary": "Attempted to call map() on an undefined value.",
  "rootCause": "users is undefined when the component renders.",
  "confidence": 0.91,
  "relatedPatterns": [],
  "solution": {
    "description": "Initialize users as an empty array.",
    "code": "const [users, setUsers] = useState([]);"
  },
  "optimization": {
    "performance": "...",
    "complexity": "...",
    "security": "...",
    "maintainability": "..."
  },
  "additionalContextRequired": false
}
```

This allows the CLI to format the response beautifully.

---

# 8. Root Cause Analysis

The system should distinguish between:

### Error

What happened?

```text
TypeError
```

### Location

Where did it happen?

```text
UserList.jsx:42
```

### Root Cause

Why did it happen?

```text
users is undefined during initial rendering.
```

### Fix

How should it be corrected?

```text
Initialize users as [].
```

### Optimization

Can the solution be improved?

```text
Avoid unnecessary conditional checks.
Handle loading state separately.
```

---

# 9. Knowledge Graph Integration

This is a critical differentiator.

Do NOT simply implement:

```text
Error → LLM → Answer
```

Prefer:

```text
Error
 ↓
Classification
 ↓
BugGraph Search
 ↓
Similar Bugs
 ↓
Known Patterns
 ↓
Related Components
 ↓
Historical Solutions
 ↓
LLM Context
 ↓
Solution
```

Example:

```text
E11000 duplicate key error
        ↓
MongoDB
        ↓
Unique Index
        ↓
Duplicate Key
        ↓
Related historical bugs
        ↓
Known fixes
        ↓
LLM
```

The AI should use retrieved BugGraph knowledge as context when generating its diagnosis and recommendation.

---

# 10. Solution Quality / Optimization

The backend should not simply ask the LLM:

> "Fix this error."

The solution-generation pipeline should evaluate:

* Correctness
* Performance
* Time complexity
* Space complexity
* Security
* Maintainability
* Readability
* Scalability
* Compatibility
* Potential side effects

For algorithmic problems, explicitly identify complexity where possible:

```text
Current: O(n²)
Recommended: O(n)
Space: O(n)
```

For application bugs, evaluate:

```text
Correctness
Performance
Security
Maintainability
Reliability
```

---

# 11. Insufficient Context Handling

The AI must NOT pretend to know the exact solution when insufficient information exists.

Example:

```text
NullPointerException
```

The backend may only be able to provide likely causes.

Return something like:

```json
{
  "additionalContextRequired": true,
  "confidence": 0.52,
  "missingContext": [
    "Relevant source code",
    "Complete stack trace"
  ]
}
```

The CLI can then ask the developer for more information.

This is especially important for accurate debugging.

---

# 12. Interactive Debug Session

For complex bugs, support a session model.

Example:

```text
Developer
   ↓
Error
   ↓
AI Analysis
   ↓
AI asks for source code
   ↓
Developer provides code
   ↓
AI analyzes again
   ↓
AI asks for configuration/logs
   ↓
Developer provides context
   ↓
Final diagnosis
   ↓
Fix
```

Potential backend:

```http
POST /api/debug/session
```

The session could maintain:

* Original error.
* Stack trace.
* Previous messages.
* Source code.
* Environment information.
* Previous analysis.
* AI recommendations.
* Developer feedback.

---

# 13. CLI UX

The terminal output should be structured and easy to read.

Example:

```text
🔍 ANALYSIS

Error:
TypeError: Cannot read properties of undefined

📍 Location:
UserList.jsx:42

🎯 ROOT CAUSE

The users variable is undefined during initial rendering.

🛠️ RECOMMENDED FIX

Initialize users as an empty array.

⚡ OPTIMIZATION

✓ Prevents undefined access
✓ Avoids unnecessary checks
✓ Handles initial render safely

📊 COMPLEXITY

Time: O(n)
Space: O(n)

💡 WHY THIS WORKS

...
```

Use `chalk` and `ora` only for presentation.

The CLI should receive structured backend data rather than formatting raw LLM output itself.

---

# 14. Suggested New Backend Architecture

Design the backend around separate responsibilities:

```text
/api/debug
      │
      ↓
Debug Controller
      │
      ↓
Debug Service
      │
 ┌────┼───────────────┐
 ↓    ↓               ↓
Parser Classifier Knowledge
       │             Graph
       └──────┬──────┘
              ↓
        Context Builder
              ↓
          LLM Service
              ↓
       Solution Validator
              ↓
       Structured Response
```

Potential modules:

```text
debug/
├── controller
├── service
├── parser
├── classifier
├── context-builder
├── knowledge-retriever
├── llm-service
├── solution-validator
└── session-service
```

Do not blindly follow these names; generate the best architecture based on the existing repository.

---

# 15. Important Security Requirements

The debugging system may receive:

* Source code
* Stack traces
* Environment variables
* Logs
* API errors
* Database errors
* Potentially sensitive information

Therefore:

* Never log raw tokens.
* Never expose authentication credentials.
* Sanitize sensitive values where possible.
* Avoid storing secrets inside debugging sessions.
* Validate request sizes.
* Limit extremely large logs.
* Prevent prompt injection from blindly controlling system behavior.
* Clearly separate developer-provided content from system instructions.
* Apply authentication and authorization to debug endpoints.
* Rate-limit expensive LLM requests.

---

# 16. Important Performance Requirements

LLM requests can be expensive and slow.

Backend should consider:

* Input size limits.
* Log truncation.
* Caching repeated errors.
* Reusing known bug patterns.
* Avoiding unnecessary LLM calls.
* Retrieval before generation.
* Streaming responses for long analyses if appropriate.
* Rate limiting.
* Timeouts.
* Graceful fallback when the LLM is unavailable.

Potential optimized flow:

```text
Error
 ↓
Check known pattern
 ↓
Known solution?
 ├── YES → Return / optionally validate
 └── NO
       ↓
   Knowledge Retrieval
       ↓
      LLM
```

This can reduce unnecessary AI calls.

---

# 17. Existing `buggraph log` vs New AI Commands

Do not remove the original bug submission functionality.

They serve different purposes.

```text
buggraph log
    ↓
"I want to report/store this bug."

buggraph pipe
    ↓
"I want to automatically submit this output."

buggraph explain
    ↓
"Tell me what this error means."

buggraph solve
    ↓
"Tell me how to solve this."

buggraph fix
    ↓
"Give me a concrete code fix."

buggraph debug
    ↓
"Work with me interactively until we solve it."
```

---

# 18. CI/CD Compatibility

The new commands must work in non-interactive environments.

Example:

```bash
npm test 2>&1 | buggraph solve --non-interactive
```

In CI:

* Do not ask interactive questions.
* Automatically generate a title/summary.
* Analyze the available logs.
* Return machine-readable output where useful.
* Exit with appropriate status codes.
* Avoid hanging while waiting for stdin.

Possible future format:

```bash
buggraph solve --json
```

for CI automation.

---

# 19. Backward Compatibility

The new implementation must not break:

```bash
buggraph auth
buggraph status
buggraph log
buggraph pipe
```

Existing API behavior should remain compatible unless a deliberate API versioning change is required.

---

# 20. Testing Requirements

The new backend implementation plan should include tests for:

### Input

* Plain pasted errors.
* Multiline stack traces.
* Large logs.
* Empty input.
* Malformed input.

### Parser

* JavaScript errors.
* Java errors.
* Python errors.
* Compiler errors.
* Runtime errors.
* Framework-specific errors where supported.

### AI

* Root cause generation.
* Solution generation.
* Insufficient-context detection.
* Confidence handling.
* Structured output validation.

### Knowledge Graph

* Similar bug retrieval.
* Pattern retrieval.
* Historical solution retrieval.

### Security

* Authentication.
* Authorization.
* Input sanitization.
* Prompt injection resistance.
* Secret handling.
* Request size limits.

### Performance

* Repeated error caching.
* LLM timeout.
* Rate limiting.
* Large log handling.

### Sessions

* Session creation.
* Context persistence.
* Multi-turn debugging.
* Session expiration/cleanup.

---

# 21. Antigravity Task

Using this specification and the existing repository architecture, **do NOT immediately implement the code**.

First generate a new, detailed **Backend Implementation Guide / Development Plan** for the AI debugging extension.

The plan should:

1. Inspect the existing repository structure.
2. Identify existing `/api/bugs` implementation.
3. Identify the existing LLM/AI architecture.
4. Identify the existing BugGraph/knowledge graph architecture.
5. Determine how the new debugging system should integrate with them.
6. Avoid duplicating existing services.
7. Propose exact backend files/modules to add or modify.
8. Propose API contracts.
9. Define request/response schemas.
10. Define error handling.
11. Define authentication/authorization.
12. Define LLM integration.
13. Define knowledge graph retrieval.
14. Define solution validation/optimization.
15. Define interactive debugging session architecture.
16. Define CLI ↔ backend communication.
17. Define testing strategy.
18. Define security requirements.
19. Define performance/caching strategy.
20. Define phased implementation order.
21. Identify dependencies and potential blockers.
22. Identify open architectural questions before coding.

The final result should be a **practical step-by-step implementation plan for the backend team**, with enough technical detail that development can begin after the plan is reviewed and approved.

## Core Product Vision

Transform BugGraph from:

> **An AI-powered bug pattern storage/classification backend**

into:

> **An AI-powered debugging platform that can collect, understand, explain, diagnose, and help resolve software bugs using historical bug patterns and knowledge-graph context.**
