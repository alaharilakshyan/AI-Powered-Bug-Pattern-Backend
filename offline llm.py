import json
import re
import requests

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
# Default coding model. Use "qwen2.5-coder:1.5b" if you need faster CPU inference.
MODEL_NAME = "qwen2.5-coder:3b"


# ---------------------------------------------------------------------------
# 1. PROMPT BUILDER (HANDLES ALL ERROR CATEGORIES + MEMORY)
# ---------------------------------------------------------------------------
def build_prompt(error_log: str, code_snippet: str = "", environment: str = "General", past_memory: dict = None) -> str:
    """
    Combines input logs, code context, environment metadata, and past database
    solutions into an organized prompt template.
    """
    if past_memory and past_memory.get("found"):
        memory_section = f"""
[PAST NOTEBOOK KNOWLEDGE FROM LOCAL DATABASE]
Similar Bug Found: {past_memory.get('summary', '')}
Proven Fix Pattern: {past_memory.get('past_solution', '')}
"""
    else:
        memory_section = "[PAST NOTEBOOK KNOWLEDGE]: No past records found in database. Analyze from baseline."

    code_section = f"\n[RELEVANT CODE SNIPPET / CONFIG]:\n{code_snippet}" if code_snippet else "\n[RELEVANT CODE SNIPPET / CONFIG]: Not provided."

    system_instructions = (
        "You are an offline debugging workstation engine. Analyze the error input, categorize "
        "the failure phase (Build/Compile, Asset/Linking, Runtime, or Configuration), explain the "
        "root cause, provide the missing or corrected code, and construct a hierarchical dependency tree.\n"
        "You MUST respond ONLY with a raw JSON object matching this schema:\n"
        "{\n"
        '  "error_category": "Build/Compile | Asset/Linking | Runtime | Configuration",\n'
        '  "bug_type": "string",\n'
        '  "root_cause": "string",\n'
        '  "plain_explanation": "string",\n'
        '  "code_patch": "string",\n'
        '  "tree_nodes": [\n'
        '    {"id": "root", "label": "Root Cause: ...", "parent": null},\n'
        '    {"id": "impact", "label": "Symptom / Broken Script / Location: ...", "parent": "root"},\n'
        '    {"id": "fix", "label": "Resolution: ...", "parent": "impact"}\n'
        "  ]\n"
        "}\n"
        "Do not include conversational preamble, pleasantries, or markdown blocks. Output valid JSON only."
    )

    prompt = (
        f"{system_instructions}\n\n"
        f"[ENVIRONMENT]: {environment}\n"
        f"[ERROR LOG / TERMINAL OUTPUT]:\n{error_log}\n"
        f"{code_section}\n"
        f"{memory_section}\n\n"
        "JSON Response:"
    )
    return prompt


# ---------------------------------------------------------------------------
# 2. LOCAL AI ANALYSIS PIPELINE
# ---------------------------------------------------------------------------
def analyze_bug(error_log: str, code_snippet: str = "", environment: str = "General", past_memory: dict = None) -> dict:
    """
    Sends the arranged prompt to local Ollama, enforces strict JSON parsing,
    and returns a structured dictionary.
    """
    prompt = build_prompt(error_log, code_snippet, environment, past_memory)

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1  # Strict, factual execution
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)

        if response.status_code == 404:
            return {
                "error_category": "Configuration",
                "bug_type": "Model Missing in Ollama (404)",
                "root_cause": f"Ollama is running, but '{MODEL_NAME}' is not downloaded.",
                "plain_explanation": f"Run 'ollama pull {MODEL_NAME}' in your command prompt to download it.",
                "code_patch": "",
                "tree_nodes": [
                    {"id": "root", "label": f"Model '{MODEL_NAME}' not installed", "parent": None},
                    {"id": "fix", "label": f"Run: ollama pull {MODEL_NAME}", "parent": "root"}
                ]
            }

        response.raise_for_status()
        raw_text = response.json().get("response", "").strip()

    except requests.exceptions.ConnectionError:
        return {
            "error_category": "Configuration",
            "bug_type": "Ollama Service Offline",
            "root_cause": "Cannot establish connection to http://127.0.0.1:11434.",
            "plain_explanation": "Ollama background service is not running. Launch Ollama from your Start Menu.",
            "code_patch": "",
            "tree_nodes": [
                {"id": "root", "label": "Engine Offline", "parent": None},
                {"id": "fix", "label": "Start Ollama desktop application", "parent": "root"}
            ]
        }
    except requests.exceptions.Timeout:
        return {
            "error_category": "Runtime",
            "bug_type": "Inference Timeout",
            "root_cause": "Model took longer than 90 seconds to reply.",
            "plain_explanation": "Hardware resources are strained. Consider switching to 'qwen2.5-coder:1.5b'.",
            "code_patch": "",
            "tree_nodes": []
        }

    cleaned_json = re.sub(r"^```json\s*|^```\s*|```$", "", raw_text, flags=re.MULTILINE).strip()

    try:
        return json.loads(cleaned_json)
    except json.JSONDecodeError:
        return {
            "error_category": "Unknown",
            "bug_type": "JSON Parsing Error",
            "root_cause": "The model response did not conform to JSON.",
            "plain_explanation": raw_text,
            "code_patch": "",
            "tree_nodes": []
        }


# ---------------------------------------------------------------------------
# 3. TERMINAL ASCII TREE RENDERER
# ---------------------------------------------------------------------------
def print_terminal_tree(nodes: list):
    """
    Renders hierarchical tree nodes directly in the terminal shell.
    """
    if not nodes:
        print("  (No dependency tree nodes generated)")
        return

    children_map = {}
    roots = []

    for node in nodes:
        parent = node.get("parent")
        if parent is None:
            roots.append(node)
        else:
            children_map.setdefault(parent, []).append(node)

    def print_node(node, prefix="", is_last=True):
        connector = "└── " if is_last else "├── "
        label = node.get("label", "Unknown Node")
        print(f"{prefix}{connector}{label}")

        child_prefix = prefix + ("    " if is_last else "│   ")
        children = children_map.get(node.get("id"), [])
        for i, child in enumerate(children):
            print_node(child, child_prefix, i == (len(children) - 1))

    for i, root_node in enumerate(roots):
        print_node(root_node, "", i == (len(roots) - 1))


# ---------------------------------------------------------------------------
# 4. TERMINAL SHELL REPORT DISPLAY
# ---------------------------------------------------------------------------
def display_terminal_report(result: dict):
    print("\n" + "=" * 70)
    print(f" 📂 CATEGORY : {result.get('error_category', 'General')}")
    print(f" 🔍 BUG TYPE : {result.get('bug_type', 'Unknown Error')}")
    print("=" * 70)

    print("\n[🎯 ROOT CAUSE]")
    print(f"  {result.get('root_cause', 'N/A')}")

    print("\n[📖 EXPLANATION FOR DEVELOPERS]")
    print(f"  {result.get('plain_explanation', 'N/A')}")

    print("\n[🌳 GRAPHIC ERROR & DEPENDENCY TREE]")
    print_terminal_tree(result.get("tree_nodes", []))

    print("\n[🛠️ RECOMMENDED CODE / FIX ACTION]")
    code = result.get("code_patch", "").strip()
    if code:
        for line in code.split("\n"):
            print(f"  + {line}")
    else:
        print("  (No code patch required or snippet missing)")
    print("=" * 70 + "\n")


# ---------------------------------------------------------------------------
# 5. TEST RUN: SCRIPT LINKING / ASSET FAILURE EXAMPLE
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\nStarting local debugging analysis...")

    # Example: A web linking bug where index.html calls an undefined function
    # because auth.js had a broken path / 404.
    sample_error = (
        "GET http://localhost:3000/static/js/auth.js net::ERR_ABORTED 404 (Not Found)\n"
        "Uncaught ReferenceError: loginUser is not defined at (index.html:45:13)"
    )

    sample_code = """
<!-- index.html -->
<head>
    <script src="/static/js/auth.js"></script>
</head>
<body>
    <button onclick="loginUser()">Sign In</button>
</body>
"""
    sample_env = "Vanilla HTML / JavaScript / Express Server"
    database_memory = {"found": False}

    output = analyze_bug(
        error_log=sample_error,
        code_snippet=sample_code,
        environment=sample_env,
        past_memory=database_memory
    )

    display_terminal_report(output)
