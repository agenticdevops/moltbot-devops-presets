---
sidebar_position: 1
---

# 5-Minute Telegram Setup

Get a DevOps Telegram bot monitoring your infrastructure in 5 minutes.

## What You'll Build

A Telegram bot that can:
- Check Kubernetes cluster health
- Monitor Docker containers
- Run system diagnostics
- Send daily heartbeat reports
- Alert on cluster status changes

## Prerequisites

- Docker installed
- Telegram account
- (Optional) kubectl configured for your cluster

## Step 1: Create Telegram Bot (1 min)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `My DevOps Bot`
4. Choose a username: `mydevops_bot` (must end in `bot`)
5. Copy the **API token** (looks like `123456789:ABCdefGHI...`)

```
✅ Done! Your bot token: 123456789:ABCdefGHIjklmNOPqrs
```

## Step 2: Get Your Chat ID (30 sec)

1. Start a chat with your new bot
2. Send any message like `/start`
3. Open this URL in browser (replace TOKEN):

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

4. Find `"chat":{"id":123456789}` - that's your Chat ID

## Step 3: Start Opsbot (1 min)

Create a `.env` file:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-key-here
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmNOPqrs
OPSBOT_SAFETY_MODE=plan-mode
```

Start with Docker:

```bash
docker run -d \
  --name opsbot \
  -p 3000:3000 \
  --env-file .env \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.kube:/root/.kube:ro \
  ghcr.io/agenticdevops/opsbot:latest
```

Verify it's running:

```bash
curl http://localhost:3000/health
# {"status":"healthy",...}
```

## Step 4: Connect Webhook (30 sec)

For local testing, use ngrok:

```bash
ngrok http 3000
# Forwarding: https://abc123.ngrok.io -> localhost:3000
```

Set the webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/webhooks/telegram"}'
```

## Step 5: Test It! (2 min)

Open Telegram and send these commands to your bot:

### Check System Health

```
/health
```

Response:
```
🟢 System Status: Healthy
├── Memory: 45% used
├── Disk: 62% used
├── Load: 0.8, 0.6, 0.5
└── Uptime: 14 days
```

### List Docker Containers

```
docker ps
```

Response:
```
📦 Running Containers (3)
├── nginx (Up 2 days)
├── postgres (Up 5 days)
└── redis (Up 5 days)
```

### Check Kubernetes Cluster

```
kubectl get nodes
```

Response:
```
🎯 Plan #abc123 - kubectl get nodes
Risk: LOW (read-only)

Ready to execute? Reply:
/approve abc123
```

Then:
```
/approve abc123
```

Response:
```
☸️ Kubernetes Nodes (3)
├── node-1: Ready (v1.29.0)
├── node-2: Ready (v1.29.0)
└── node-3: Ready (v1.29.0)
```

### View Pod Status

```
kubectl get pods -n production
```

### Check Container Logs

```
docker logs nginx --tail 20
```

---

## Set Up Daily Heartbeat

Add a cron job for daily cluster status at 9 AM:

```bash
# Add to crontab -e
0 9 * * * curl -X POST http://localhost:3000/api/heartbeat/trigger
```

Or use the built-in scheduler by setting environment variable:

```bash
OPSBOT_HEARTBEAT_CRON="0 9 * * *"
OPSBOT_HEARTBEAT_CHAT_ID=123456789
```

Daily report looks like:

```
📊 Daily DevOps Report - Jan 28, 2026

☸️ Kubernetes
├── Nodes: 3/3 Ready
├── Pods: 42 Running, 0 Pending, 0 Failed
└── Deployments: 12/12 Available

🐳 Docker
├── Containers: 8 running
├── Images: 24 (12.4 GB)
└── Networks: 5

💻 System
├── CPU: 23% avg
├── Memory: 8.2/16 GB
├── Disk: 120/500 GB
└── Uptime: 14 days

✅ All systems operational
```

---

## Set Up Alerts

Configure Slack-style alerts for critical events:

```bash
# In .env
OPSBOT_ALERT_CHAT_ID=123456789
OPSBOT_ALERT_ON_POD_RESTART=true
OPSBOT_ALERT_ON_NODE_NOT_READY=true
OPSBOT_ALERT_ON_HIGH_MEMORY=80
```

Alert example:

```
🚨 ALERT: Pod Restart Detected

Pod: api-server-7d4f8b6c9-x2k4m
Namespace: production
Restarts: 3 in last hour
Reason: OOMKilled

Quick actions:
/logs api-server-7d4f8b6c9-x2k4m
/describe pod api-server-7d4f8b6c9-x2k4m
```

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `/health` | System health check |
| `/plans` | List pending plans |
| `/approve <id>` | Approve a plan |
| `/reject <id>` | Reject a plan |
| `docker ps` | List containers |
| `docker logs <name>` | View container logs |
| `kubectl get pods` | List Kubernetes pods |
| `kubectl get nodes` | List cluster nodes |
| `kubectl describe pod <name>` | Pod details |

---

## Safety Modes

Opsbot runs in **plan-mode** by default:

- **Read operations** (get, list, describe, logs) execute immediately
- **Write operations** (scale, delete, apply) require approval

Change mode:

```bash
# Read-only (safest)
OPSBOT_SAFETY_MODE=read-only

# Plan mode (default)
OPSBOT_SAFETY_MODE=plan-mode

# Full access (dangerous!)
OPSBOT_SAFETY_MODE=full-access
```

---

## Next Steps

- [Configure more skills](/docs/developers/skills)
- [Deploy to Kubernetes](/docs/deployment/kubernetes)
- [Set up Slack integration](/docs/users/slack-bot)
- [API Reference](/docs/developers/api)

---

## Troubleshooting

### Bot not responding?

```bash
# Check server is running
curl http://localhost:3000/health

# Check webhook is set
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Check logs
docker logs opsbot
```

### Permission denied for Docker?

Mount the Docker socket:

```bash
-v /var/run/docker.sock:/var/run/docker.sock
```

### kubectl not working?

Mount your kubeconfig:

```bash
-v ~/.kube:/root/.kube:ro
```

### Getting "Unauthorized" from cluster?

The RBAC role may need adjustment. See [Kubernetes RBAC setup](/docs/deployment/kubernetes#rbac).
