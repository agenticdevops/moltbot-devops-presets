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
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# Step 1: Check/Install clawdbot
echo "📦 Checking clawdbot..."
if ! check_command clawdbot; then
    echo "   Installing clawdbot..."
    if check_command npm; then
        npm install -g clawdbot
    elif check_command bun; then
        bun install -g clawdbot
    else
        echo "❌ Error: npm or bun required to install clawdbot"
        exit 1
    fi
    echo "   ✓ clawdbot installed"
else
    VERSION=$(clawdbot --version 2>/dev/null || echo "unknown")
    echo "   ✓ clawdbot ${VERSION} found"
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
    cd "$SKILLS_LOCAL"
    git pull --quiet origin main 2>/dev/null || echo "   (using cached version)"
    cd - > /dev/null
else
    echo "   Cloning DevOps skills pack..."
    git clone --quiet "$SKILLS_REPO" "$SKILLS_LOCAL"
fi

# Step 4: Symlink skills
echo ""
echo "🔗 Linking skills..."
for skill_dir in "$SKILLS_LOCAL/skills/"*/; do
    skill_name=$(basename "$skill_dir")
    target="$SKILLS_DIR/$skill_name"

    if [ ! -e "$target" ]; then
        ln -s "$skill_dir" "$target"
        echo "   ✓ $skill_name"
    fi
done

# Step 5: Select preset
echo ""
echo "🛡️  Select safety mode:"
echo ""
echo "   1) Safe       - Read-only operations only (most restrictive)"
echo "   2) Standard   - Mutations require approval (recommended)"
echo "   3) Full       - All operations allowed (dangerous!)"
echo ""
read -p "   Choice [2]: " choice
choice=${choice:-2}

case $choice in
    1)
        preset="devops-safe"
        mode_desc="read-only"
        ;;
    3)
        preset="devops-full"
        mode_desc="full access"
        echo ""
        echo "   ⚠️  Warning: Full access mode allows all commands without approval!"
        read -p "   Are you sure? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            preset="devops-standard"
            mode_desc="standard"
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

# Check if config exists
if [ -f "$CONFIG_FILE" ]; then
    echo "   Existing config found. Backing up to clawdbot.json.bak"
    cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"
fi

# Download preset
curl -sL "${PRESETS_BASE}/${preset}.json" > "$CONFIG_FILE"
echo "   ✓ Config saved to $CONFIG_FILE"

# Step 7: Check available skills
echo ""
echo "📋 Checking skill eligibility..."
ELIGIBLE=$(clawdbot skills list --eligible 2>/dev/null | grep -c "enabled" || echo "?")
echo "   ✓ ${ELIGIBLE} DevOps skills ready"

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
