---
sidebar_position: 3
---

# Environment Variables

Complete reference of environment variables for Opsbot.

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |

Or one of these alternatives:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `OPSBOT_CONFIG_PATH` | `~/.opsbot/config.json` | Config file path |
| `OPSBOT_DATA_DIR` | `./data` | Data directory |
| `OPSBOT_MEMORY_DIR` | `./memory` | Plans and audit logs |

## Safety

| Variable | Default | Description |
|----------|---------|-------------|
| `OPSBOT_SAFETY_MODE` | `plan-mode` | Safety mode: `read-only`, `plan-mode`, `full-access` |
| `OPSBOT_DRY_RUN` | `false` | Enable dry-run mode (no actual execution) |

## Heartbeat & Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `OPSBOT_HEARTBEAT_CHAT_ID` | - | Telegram chat ID for heartbeat messages |
| `OPSBOT_HEARTBEAT_INTERVAL_HOURS` | `24` | Hours between heartbeat reports |
| `OPSBOT_ALERT_CHAT_ID` | - | Chat ID for alert notifications |
| `OPSBOT_ALERT_ON_POD_RESTART` | `false` | Alert on Kubernetes pod restarts |
| `OPSBOT_ALERT_ON_NODE_NOT_READY` | `false` | Alert when nodes become NotReady |
| `OPSBOT_ALERT_ON_HIGH_MEMORY` | - | Memory % threshold for alerts |

## Channels

### Telegram

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from BotFather |

### Slack

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Slack bot token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Slack app token (`xapp-...`) |
| `SLACK_SIGNING_SECRET` | Slack signing secret |

## Cloud Credentials

Opsbot uses standard cloud credential environment variables:

### AWS

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | Default region |
| `AWS_PROFILE` | Named profile |

### Google Cloud

| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `CLOUDSDK_CORE_PROJECT` | Default project |

### Azure

| Variable | Description |
|----------|-------------|
| `AZURE_CLIENT_ID` | Azure client ID |
| `AZURE_CLIENT_SECRET` | Azure client secret |
| `AZURE_TENANT_ID` | Azure tenant ID |

## Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `text` | Log format: `text`, `json` |

## Docker Example

```bash
docker run -d \
  --name opsbot \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e TELEGRAM_BOT_TOKEN=123456:ABC... \
  -e OPSBOT_SAFETY_MODE=plan-mode \
  -e LOG_LEVEL=info \
  -v opsbot-data:/app/data \
  ghcr.io/agenticdevops/opsbot:latest
```

## Kubernetes Example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opsbot-secrets
stringData:
  ANTHROPIC_API_KEY: sk-ant-...
  TELEGRAM_BOT_TOKEN: "123456:ABC..."
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: opsbot
          envFrom:
            - secretRef:
                name: opsbot-secrets
          env:
            - name: OPSBOT_SAFETY_MODE
              value: "plan-mode"
            - name: LOG_LEVEL
              value: "info"
```

## docker-compose Example

```yaml
services:
  opsbot:
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - OPSBOT_SAFETY_MODE=plan-mode
```

With `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=123456:ABC...
```
