---
sidebar_position: 3
---

# Configuration

Complete configuration reference for Opsbot.

## Configuration File

Opsbot uses a JSON configuration file located at `~/.opsbot/config.json` or specified via `OPSBOT_CONFIG_PATH`.

### Full Example

```json
{
  "version": 1,
  "environment": "local",

  "safety": {
    "mode": "plan-mode",
    "planTimeoutSec": 300,
    "alwaysRequireApproval": ["delete", "destroy", "terminate"],
    "forwardApprovals": {
      "enabled": true,
      "channel": "slack",
      "target": "#ops-approvals"
    },
    "autoApproveLowRisk": false
  },

  "ai": {
    "provider": "anthropic",
    "model": "claude-3-opus-20240229"
  },

  "skills": {
    "allowBundled": ["docker", "kubernetes", "terraform", "github"],
    "entries": {
      "kubernetes": {
        "enabled": true,
        "config": {
          "productionContexts": ["prod", "production"]
        }
      }
    }
  },

  "channels": {
    "tui": { "enabled": true },
    "telegram": { "enabled": true },
    "slack": { "enabled": false }
  },

  "exec": {
    "security": "allowlist",
    "onMiss": "ask",
    "safeBins": ["jq", "yq", "grep", "awk", "sed", "curl"]
  },

  "logging": {
    "level": "info",
    "redactSecrets": true
  }
}
```

## Configuration Sections

### Safety

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | string | `"plan-mode"` | Safety mode: `read-only`, `plan-mode`, `full-access` |
| `planTimeoutSec` | number | `300` | Plan expiration time in seconds |
| `alwaysRequireApproval` | string[] | `["delete", "destroy"]` | Commands always requiring approval |
| `autoApproveLowRisk` | boolean | `false` | Auto-approve LOW risk operations |

### AI Provider

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | string | `"anthropic"` | AI provider: `anthropic`, `openai`, `openrouter` |
| `model` | string | - | Model to use (provider-specific) |
| `apiKey` | string | - | API key (prefer env var) |

### Skills

| Field | Type | Description |
|-------|------|-------------|
| `allowBundled` | string[] | Bundled skills to enable |
| `entries` | object | Per-skill configuration |

### Channels

| Field | Type | Description |
|-------|------|-------------|
| `tui.enabled` | boolean | Enable terminal UI |
| `telegram.enabled` | boolean | Enable Telegram bot |
| `slack.enabled` | boolean | Enable Slack integration |

### Exec Security

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `security` | string | `"allowlist"` | Mode: `allowlist`, `denylist`, `open` |
| `onMiss` | string | `"ask"` | Action on miss: `deny`, `ask`, `allow` |
| `safeBins` | string[] | `["jq", ...]` | Safe binaries |

## Environment Variables

Environment variables override config file settings:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `SLACK_BOT_TOKEN` | Slack bot token |
| `OPSBOT_SAFETY_MODE` | Override safety mode |
| `OPSBOT_CONFIG_PATH` | Config file path |
| `OPSBOT_DATA_DIR` | Data directory |
| `OPSBOT_MEMORY_DIR` | Memory/plans directory |
| `OPSBOT_DRY_RUN` | Enable dry-run mode |
| `PORT` | Server port (default: 3000) |

## Presets

Use preconfigured presets for common scenarios:

### Read-Only (Safest)

```json
{
  "safety": { "mode": "read-only" },
  "exec": { "security": "allowlist", "onMiss": "deny" }
}
```

### Plan Mode (Recommended)

```json
{
  "safety": { "mode": "plan-mode", "planTimeoutSec": 300 },
  "exec": { "security": "allowlist", "onMiss": "ask" }
}
```

### GitOps

```json
{
  "safety": { "mode": "plan-mode" },
  "gitops": { "enabled": true, "repository": "org/infra" }
}
```
