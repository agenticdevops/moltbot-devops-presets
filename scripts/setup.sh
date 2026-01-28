#!/bin/bash
# Moltbot DevOps Presets Setup
# https://github.com/agenticdevops/moltbot-devops-presets

set -e

VERSION="0.2.0"
SKILLS_REPO="https://github.com/agenticdevops/agentic-ops-skills.git"
PRESETS_BASE="https://raw.githubusercontent.com/agenticdevops/moltbot-devops-presets/main/presets"

echo ""
echo "🤖 Moltbot DevOps Presets Setup v${VERSION}"
echo "   Safety-first DevOps automation for Clawdbot"
echo ""

# Check for required tools
check_command() {
    command -v "$1" &> /dev/null
}

# Step 1: Check/Install clawdbot
echo "📦 Checking clawdbot..."
if check_command clawdbot; then
    # Use timeout to prevent hanging (clawdbot can hang on some systems)
    if check_command timeout; then
        CLAWDBOT_VERSION=$(timeout 5 clawdbot --version 2>/dev/null || echo "installed")
    else
        # macOS doesn't have timeout by default, try gtimeout or skip version check
        if check_command gtimeout; then
            CLAWDBOT_VERSION=$(gtimeout 5 clawdbot --version 2>/dev/null || echo "installed")
        else
            CLAWDBOT_VERSION="installed"
        fi
    fi
    echo "   ✓ clawdbot ${CLAWDBOT_VERSION} found"
else
    echo "   clawdbot not found, installing..."

    if check_command npm; then
        echo "   Using npm (this may take a few minutes)..."
        npm install -g clawdbot --loglevel=error
    elif check_command bun; then
        echo "   Using bun..."
        bun install -g clawdbot
    else
        echo ""
        echo "❌ Error: npm or bun is required to install clawdbot"
        echo ""
        echo "   Install Node.js first:"
        echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
        echo ""
        echo "   Then run this script again."
        exit 1
    fi

    if check_command clawdbot; then
        echo "   ✓ clawdbot installed"
    else
        echo "❌ Error: clawdbot installation failed"
        exit 1
    fi
fi

# Step 2: Setup skills directory
SKILLS_DIR="$HOME/.clawdbot/skills"
mkdir -p "$SKILLS_DIR"

# Step 3: Clone/update DevOps skills
SKILLS_LOCAL="$HOME/agentic-ops-skills"
echo ""
echo "📚 Setting up DevOps skills..."

if [ -d "$SKILLS_LOCAL" ]; then
    echo "   Updating existing skills..."
    (cd "$SKILLS_LOCAL" && git pull --quiet origin main 2>/dev/null) || echo "   (using cached version)"
else
    echo "   Cloning DevOps skills pack..."
    git clone --quiet "$SKILLS_REPO" "$SKILLS_LOCAL"
fi

# Step 4: Symlink skills
echo ""
echo "🔗 Linking skills..."
LINKED=0
for skill_dir in "$SKILLS_LOCAL/skills/"*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    target="$SKILLS_DIR/$skill_name"

    if [ ! -e "$target" ]; then
        ln -s "$skill_dir" "$target"
        echo "   ✓ $skill_name"
        LINKED=$((LINKED + 1))
    fi
done

if [ "$LINKED" -eq 0 ]; then
    echo "   (all skills already linked)"
fi

# Step 5: Select preset
echo ""
echo "🛡️  Select safety mode:"
echo ""
echo "   1) Safe       - Read-only operations only (most restrictive)"
echo "   2) Standard   - Mutations require approval (recommended)"
echo "   3) Full       - All operations allowed (dangerous!)"
echo ""

# Handle non-interactive mode
if [ -t 0 ]; then
    read -p "   Choice [2]: " choice
    choice=${choice:-2}
else
    echo "   Non-interactive mode detected, using Standard (2)"
    choice=2
fi

case $choice in
    1)
        preset="devops-safe"
        mode_desc="read-only"
        ;;
    3)
        preset="devops-full"
        mode_desc="full access"
        if [ -t 0 ]; then
            echo ""
            echo "   ⚠️  Warning: Full access mode allows all commands without approval!"
            read -p "   Are you sure? (y/N): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                preset="devops-standard"
                mode_desc="standard"
            fi
        fi
        ;;
    *)
        preset="devops-standard"
        mode_desc="standard"
        ;;
esac

# Step 6: Download and apply preset
echo ""
echo "⚙️  Applying ${preset} preset..."
CONFIG_FILE="$HOME/.clawdbot/clawdbot.json"

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
    echo "   Backing up existing config..."
    cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"
fi

# Download preset
if curl -sL "${PRESETS_BASE}/${preset}.json" > "$CONFIG_FILE"; then
    echo "   ✓ Config saved to $CONFIG_FILE"
else
    echo "❌ Error: Failed to download preset"
    exit 1
fi

# Step 7: Verify setup
echo ""
echo "📋 Verifying setup..."
if check_command clawdbot; then
    echo "   ✓ clawdbot found in PATH"
else
    echo "   ⚠️  clawdbot not in PATH (may need to restart shell)"
fi

if [ -d "$SKILLS_DIR" ] && [ "$(ls -A $SKILLS_DIR 2>/dev/null)" ]; then
    SKILL_COUNT=$(ls -1 "$SKILLS_DIR" 2>/dev/null | wc -l | tr -d ' ')
    echo "   ✓ ${SKILL_COUNT} skills linked"
else
    echo "   ⚠️  No skills found"
fi

if [ -f "$CONFIG_FILE" ]; then
    echo "   ✓ Config file exists"
else
    echo "   ⚠️  Config file missing"
fi

# Done
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DevOps presets configured!"
echo ""
echo "   Safety Mode: ${mode_desc}"
echo "   Config:      ${CONFIG_FILE}"
echo "   Skills:      ${SKILLS_DIR}"
echo ""
echo "Next steps:"
echo ""
echo "   1. Ensure ANTHROPIC_API_KEY is set (or run 'clawdbot onboard')"
echo ""
echo "   2. For Telegram bot:"
echo "      export TELEGRAM_BOT_TOKEN=your-bot-token"
echo ""
echo "   3. Start clawdbot:"
echo "      clawdbot"
echo ""
echo "   4. Try a command:"
echo "      > Check my kubernetes cluster health"
echo "      > List running docker containers"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
