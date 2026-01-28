---
sidebar_position: 1
---

# Quick Start

Get Opsbot running in 5 minutes.

## Prerequisites

- Node.js 22+ or Bun 1.1+
- Docker (optional, for deployment)
- Anthropic API key (or OpenAI/OpenRouter)

## Installation

### Option 1: npm/bun

```bash
# Clone the repository
git clone https://github.com/agenticdevops/opsbot.git
cd opsbot

# Install dependencies
bun install

# Build
bun run build
```

### Option 2: Docker

```bash
# Pull the image
docker pull ghcr.io/agenticdevops/opsbot:latest

# Or build locally
docker build -t opsbot .
```

## Configuration

Create a configuration file:

```bash
mkdir -p ~/.opsbot
```

Create `~/.opsbot/config.json`:

```json
{
  "version": 1,
  "safety": {
    "mode": "plan-mode"
  },
  "ai": {
    "provider": "anthropic"
  },
  "skills": {
    "allowBundled": ["docker", "kubernetes", "terraform", "github"]
  },
  "channels": {
    "tui": { "enabled": true }
  }
}
```

Set your API key:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

## Start the Server

```bash
# With bun
bun run apps/server/src/index.ts

# Or with Docker
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY opsbot
```

## Verify Installation

```bash
# Check health
curl http://localhost:3000/health

# List plans
curl http://localhost:3000/api/plans
```

## Next Steps

- [Configure Telegram Bot](/docs/users/telegram-bot)
- [Understanding Safety Modes](/docs/users/safety-modes)
- [Deploy to Kubernetes](/docs/deployment/kubernetes)
