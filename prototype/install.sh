#!/usr/bin/env bash
# ==============================================================================
# BugGraph Workstation CLI — Official Web Installer (Linux / macOS)
# ==============================================================================
# Installs the actual clean BugGraph tool into ~/.buggraph without any dump files.
# Usage: curl -fsSL http://<host>/install.sh | bash
# ==============================================================================

set -e

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            BUGGRAPH AI WORKSTATION CLI — OFFICIAL INSTALLER            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Check Node.js runtime
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}✖ Error: Node.js is required but was not found in PATH.${NC}"
    echo -e "Please install Node.js (v18 or higher) from https://nodejs.org/ and re-run."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✖ Error: Node.js v18 or higher is required (Detected: $(node -v)).${NC}"
    exit 1
fi

echo -e "${GREEN}✔ Node.js runtime detected: $(node -v)${NC}"

# 2. Determine Server Base URL (Passed via env or default)
SERVER_URL="${BUGGRAPH_HOST:-http://127.0.0.1:4568}"
TARGET_DIR="$HOME/.buggraph"
BIN_DIR="$HOME/.local/bin"

echo -e "${GRAY}Installing BugGraph tool to: ${TARGET_DIR}${NC}"

# 3. Create clean target directories
mkdir -p "$TARGET_DIR"
mkdir -p "$BIN_DIR"

TEMP_ARCHIVE=$(mktemp /tmp/buggraph-clean.XXXXXX.tar.gz)

# 4. Download clean package from server (actual tool files only)
echo -e "${CYAN}Downloading official BugGraph tool package...${NC}"
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "${SERVER_URL}/api/install/package.tar.gz" -o "$TEMP_ARCHIVE"
elif command -v wget >/dev/null 2>&1; then
    wget -q "${SERVER_URL}/api/install/package.tar.gz" -O "$TEMP_ARCHIVE"
else
    echo -e "${RED}✖ Error: curl or wget is required to download.${NC}"
    exit 1
fi

# 5. Extract actual clean tool files
echo -e "${CYAN}Extracting clean tool distribution...${NC}"
tar -xzf "$TEMP_ARCHIVE" -C "$TARGET_DIR"

# 6. Delete temporary archive immediately (no dump files left!)
rm -f "$TEMP_ARCHIVE"

# 7. Install production dependencies cleanly
echo -e "${CYAN}Configuring production runtime dependencies...${NC}"
cd "$TARGET_DIR"
npm install --omit=dev --no-audit --no-fund --loglevel=error

# 8. Create system symlink in ~/.local/bin or /usr/local/bin
chmod +x "$TARGET_DIR/bin/buggraph.js"
ln -sf "$TARGET_DIR/bin/buggraph.js" "$BIN_DIR/buggraph"

# Try /usr/local/bin if writable
if [ -w "/usr/local/bin" ]; then
    ln -sf "$TARGET_DIR/bin/buggraph.js" "/usr/local/bin/buggraph"
fi

# Ensure ~/.local/bin is in PATH notice
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo -e "${YELLOW}Notice: Add ~/.local/bin to your PATH to run 'buggraph' from anywhere:${NC}"
    echo -e "  export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✔ BugGraph Workstation CLI installed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Try running:"
echo -e "  ${CYAN}buggraph --help${NC}      # Display all commands"
echo -e "  ${CYAN}buggraph status${NC}      # Check workstation engine status"
echo -e "  ${CYAN}buggraph pop${NC}         # Launch the visual HUD Workstation"
echo ""
