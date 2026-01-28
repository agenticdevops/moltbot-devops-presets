---
sidebar_position: 1
---

# Commands Reference

Complete reference for Opsbot commands (Telegram and API).

## Telegram Commands

### General

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message and help |
| `/help` | Show available commands |
| `/health` | Check system health |

### Plan Management

| Command | Description |
|---------|-------------|
| `/plans` | List all pending plans |
| `/plan <id>` | View plan details |
| `/status <id>` | Get plan status |

### Approval Workflow

| Command | Description |
|---------|-------------|
| `/approve <id> [comment]` | Approve a plan |
| `/reject <id> [reason]` | Reject a plan |
| `/execute <id>` | Execute an approved plan |

### Audit

| Command | Description |
|---------|-------------|
| `/audit` | View recent audit log |

## Command Examples

### View Pending Plans

```
/plans

📋 Pending Plans:

🟡 plan-20260128-001
   Scale API deployment to 5 replicas
   Risk: MEDIUM

🟢 plan-20260128-002
   Update ConfigMap
   Risk: LOW

Use /plan <id> for details
```

### Approve a Plan

```
/approve plan-20260128-001 Looks good, approved

✅ Plan plan-20260128-001 approved by @username

Use /execute plan-20260128-001 to run.
```

### Execute a Plan

```
/execute plan-20260128-001

✅ Plan plan-20260128-001 executed successfully!

Duration: 12s
Steps completed: 3/3
```

## API Endpoints

### Plans API

```bash
# List all plans
GET /api/plans

# List pending plans
GET /api/plans/pending

# Get plan details
GET /api/plans/:planId

# Get plan for review (formatted)
GET /api/plans/:planId/review

# Create a new plan
POST /api/plans
Content-Type: application/json
{
  "title": "Scale deployment",
  "riskLevel": "MEDIUM",
  "issue": "High traffic",
  "steps": [
    {
      "action": "kubectl scale",
      "description": "Scale to 5 replicas",
      "command": "kubectl scale deployment/api --replicas=5"
    }
  ]
}

# Delete a pending plan
DELETE /api/plans/:planId
```

### Approvals API

```bash
# Get pending approvals
GET /api/approvals/pending

# Approve a plan
POST /api/approvals/:planId/approve
Content-Type: application/json
{
  "approver": "username",
  "comment": "Approved"
}

# Reject a plan
POST /api/approvals/:planId/reject
Content-Type: application/json
{
  "approver": "username",
  "reason": "Not needed"
}

# Execute approved plan
POST /api/approvals/:planId/execute

# Rollback executed plan
POST /api/approvals/:planId/rollback

# Get audit log
GET /api/approvals/audit?limit=20

# Get audit for specific plan
GET /api/approvals/audit/:planId
```

### Health API

```bash
# Health check
GET /health

# Readiness check
GET /health/ready

# Liveness check
GET /health/live
```

### Webhooks API

```bash
# Telegram webhook
POST /webhooks/telegram

# Telegram bot info
GET /webhooks/telegram/info

# Setup Telegram webhook
POST /webhooks/telegram/setup
Content-Type: application/json
{
  "webhookUrl": "https://your-domain.com/webhooks/telegram"
}

# Slack events
POST /webhooks/slack/events

# Webhook health
GET /webhooks/health
```
