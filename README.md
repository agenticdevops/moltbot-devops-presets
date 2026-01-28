# Moltbot DevOps Presets

> Safety-first DevOps preset pack for [Clawdbot](https://github.com/nicksellen/clawdbot)

Pre-configured safety presets and DevOps skills for using Clawdbot as a DevOps assistant. Get a ChatOps interface to your infrastructure through Telegram, Slack, or terminal.

## Features

- **Safety-First Design** - Three safety modes (safe, standard, full)
- **DevOps Skills** - Kubernetes, Docker, Terraform, AWS, and more
- **Multiple Channels** - Telegram, Slack, Discord, or TUI
- **Uses Your Existing Auth** - Works with your Anthropic subscription via Clawdbot

## Quick Start

```bash
# One-liner setup
curl -fsSL https://raw.githubusercontent.com/agenticdevops/moltbot-devops-presets/main/scripts/setup.sh | bash
```

Or step by step:

```bash
# 1. Clone this repo
git clone https://github.com/agenticdevops/moltbot-devops-presets.git
cd moltbot-devops-presets

# 2. Run setup
./scripts/setup.sh

# 3. Start clawdbot
clawdbot
```

## Safety Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| **Safe** | Read-only operations only | Production monitoring |
| **Standard** | Mutations require approval | Day-to-day operations |
| **Full** | All operations allowed | Development/testing only |

### Safe Mode
Only allows read operations (get, describe, list, logs). Any mutation is blocked.

### Standard Mode (Recommended)
Read operations auto-execute. Mutations prompt for approval:

```
> Scale the api deployment to 5 replicas

🔸 Command requires approval:
   kubectl scale deployment/api --replicas=5

   [Allow] [Deny] [Allow All Similar]
```

### Full Mode
All commands execute without approval. Use with caution!

## DevOps Skills

Includes 11 DevOps skills from [agentic-ops-skills](https://github.com/agenticdevops/agentic-ops-skills):

| Skill | Description |
|-------|-------------|
| `k8s-deploy` | Safe Kubernetes deployments and rollbacks |
| `k8s-debug` | Kubernetes debugging and troubleshooting |
| `docker-ops` | Docker container management |
| `aws-ops` | AWS operations (EC2, S3, Lambda, ECS) |
| `terraform-workflow` | Infrastructure as Code workflows |
| `incident-response` | Structured incident response |
| `system-health` | System monitoring and diagnostics |
| `log-analysis` | Cross-platform log analysis |
| `argocd-gitops` | GitOps with ArgoCD |
| `cost-optimization` | Cloud cost management |
| `git-workflow` | DevOps git practices |

## Usage Examples

### Kubernetes
```
> Check my cluster health
> What pods are failing in production?
> Show me the logs for the api pod
> Scale the frontend deployment to 3 replicas
```

### Docker
```
> List running containers
> Show me the nginx container logs
> What's using the most resources?
```

### Terraform
```
> Plan the changes for the staging environment
> Show me the current state
> What resources would be destroyed?
```

### Incident Response
```
> We have high latency on the API. Help me investigate.
> Check the error rate for the payment service
> Create an incident summary
```

## Channels

### Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Set the token:
   ```bash
   export TELEGRAM_BOT_TOKEN=your-token
   ```
3. Start clawdbot:
   ```bash
   clawdbot
   ```

### Slack

1. Create a Slack app at https://api.slack.com/apps
2. Configure Socket Mode and Bot Token
3. Set credentials:
   ```bash
   export SLACK_BOT_TOKEN=xoxb-...
   export SLACK_APP_TOKEN=xapp-...
   ```

### Terminal (TUI)

Just run `clawdbot` - the TUI is always available.

## Configuration

Config is stored at `~/.clawdbot/clawdbot.json`. You can:

- Switch presets by copying from `presets/`
- Modify allowlist patterns
- Enable/disable specific skills
- Configure channel settings

### Manual Preset Switch

```bash
# Switch to safe mode
cp presets/devops-safe.json ~/.clawdbot/clawdbot.json

# Switch to standard mode
cp presets/devops-standard.json ~/.clawdbot/clawdbot.json
```

## Requirements

- Node.js 18+ or Bun
- Git
- [Clawdbot](https://github.com/nicksellen/clawdbot) (installed automatically by setup)
- Anthropic API key (via Clawdbot auth)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Moltbot DevOps Presets                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Presets   │  │   Skills    │  │   Setup     │     │
│  │   (JSON)    │  │ (Symlinks)  │  │  Script     │     │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘     │
└─────────┼────────────────┼──────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                     Clawdbot                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  Agent  │  │ Channels│  │  Exec   │  │  Auth   │   │
│  │ Runtime │  │ TG/Slack│  │Approvals│  │Anthropic│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              agentic-ops-skills                          │
│  k8s-deploy, docker-ops, aws-ops, terraform, ...        │
└─────────────────────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Add/modify presets in `presets/`
3. Submit a PR

For skill contributions, see [agentic-ops-skills](https://github.com/agenticdevops/agentic-ops-skills).

## License

MIT
