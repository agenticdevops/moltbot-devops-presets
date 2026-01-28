---
sidebar_position: 2
---

# API Reference

Complete REST API documentation for Opsbot.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. For production, use a reverse proxy with authentication.

## Endpoints

### Health

#### GET /health

Check server health.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:00.000Z",
  "version": "0.1.0",
  "uptime": 3600
}
```

#### GET /health/ready

Readiness check for Kubernetes.

**Response:**

```json
{
  "ready": true,
  "checks": {
    "memory": true,
    "config": true
  },
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

#### GET /health/live

Liveness check for Kubernetes.

**Response:**

```json
{
  "live": true,
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

---

### Plans

#### GET /api/plans

List all plans.

**Response:**

```json
{
  "plans": [
    {
      "id": "plan-20260128-001",
      "title": "Scale deployment",
      "riskLevel": "MEDIUM",
      "approvalStatus": "pending",
      "executionStatus": "pending",
      "createdAt": "2026-01-28T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET /api/plans/pending

List pending plans awaiting approval.

**Response:**

```json
{
  "plans": [
    {
      "id": "plan-20260128-001",
      "title": "Scale deployment",
      "riskLevel": "MEDIUM",
      "createdAt": "2026-01-28T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET /api/plans/:planId

Get plan details.

**Response:**

```json
{
  "plan": {
    "id": "plan-20260128-001",
    "title": "Scale deployment",
    "createdAt": "2026-01-28T10:30:00.000Z",
    "riskLevel": "MEDIUM",
    "context": {
      "issue": "High traffic",
      "affectedResources": [
        {
          "type": "deployment",
          "name": "api-service",
          "namespace": "production"
        }
      ]
    },
    "steps": [...],
    "rollback": {...},
    "approval": {...},
    "execution": {...}
  }
}
```

#### GET /api/plans/:planId/review

Get plan formatted for review.

**Response:**

```json
{
  "planId": "plan-20260128-001",
  "formatted": "═══════════════════════════════════════════════════════════\n..."
}
```

#### POST /api/plans

Create a new plan.

**Request:**

```json
{
  "title": "Scale deployment",
  "riskLevel": "MEDIUM",
  "issue": "High traffic causing slow responses",
  "rootCause": "Insufficient replicas",
  "estimatedDuration": "2 minutes",
  "steps": [
    {
      "action": "kubectl scale",
      "description": "Scale to 5 replicas",
      "command": "kubectl scale deployment/api --replicas=5 -n production",
      "riskLevel": "MEDIUM",
      "reversible": true,
      "timeout": "2m"
    }
  ],
  "rollback": {
    "method": "Scale back to original",
    "commands": ["kubectl scale deployment/api --replicas=3 -n production"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "plan": {
    "id": "plan-20260128-001",
    "title": "Scale deployment",
    "riskLevel": "MEDIUM",
    "requiresApproval": true
  },
  "filePath": "memory/execution-plans/plan-20260128-001.json"
}
```

#### DELETE /api/plans/:planId

Delete a pending plan.

**Response:**

```json
{
  "success": true,
  "planId": "plan-20260128-001"
}
```

---

### Approvals

#### GET /api/approvals/pending

Get pending approvals.

**Response:**

```json
{
  "pending": [
    {
      "planId": "plan-20260128-001",
      "title": "Scale deployment",
      "riskLevel": "MEDIUM",
      "createdAt": "2026-01-28T10:30:00.000Z",
      "requiresApproval": true
    }
  ],
  "total": 1
}
```

#### POST /api/approvals/:planId/approve

Approve a plan.

**Request:**

```json
{
  "approver": "username",
  "comment": "Approved for traffic spike",
  "override": false
}
```

**Response:**

```json
{
  "success": true,
  "planId": "plan-20260128-001",
  "status": "approved",
  "approver": "username",
  "message": "Plan approved. Use POST /api/approvals/:planId/execute to run."
}
```

#### POST /api/approvals/:planId/reject

Reject a plan.

**Request:**

```json
{
  "approver": "username",
  "reason": "Not needed anymore"
}
```

**Response:**

```json
{
  "success": true,
  "planId": "plan-20260128-001",
  "status": "rejected",
  "reason": "Not needed anymore"
}
```

#### POST /api/approvals/:planId/execute

Execute an approved plan.

**Response:**

```json
{
  "success": true,
  "planId": "plan-20260128-001",
  "stepResults": [
    {
      "stepId": "step-1",
      "status": "success",
      "output": "deployment.apps/api scaled",
      "durationMs": 1234
    }
  ],
  "totalDurationMs": 12345,
  "rolledBack": false
}
```

#### POST /api/approvals/:planId/rollback

Rollback an executed plan.

**Response:**

```json
{
  "success": true,
  "planId": "plan-20260128-001",
  "status": "rolled_back"
}
```

#### GET /api/approvals/audit

Get audit log.

**Query Parameters:**

- `limit` (number, default: 20) - Number of entries to return

**Response:**

```json
{
  "entries": [
    {
      "timestamp": "2026-01-28T10:30:00.000Z",
      "planId": "plan-20260128-001",
      "action": "plan_approved",
      "riskLevel": "MEDIUM",
      "status": "success",
      "approver": "username"
    }
  ],
  "stats": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "riskDistribution": {
      "LOW": 50,
      "MEDIUM": 40,
      "HIGH": 8,
      "CRITICAL": 2
    }
  }
}
```

---

### Webhooks

#### GET /webhooks/health

Check webhook status.

**Response:**

```json
{
  "status": "ready",
  "channels": {
    "telegram": {
      "configured": true,
      "bot": {
        "id": 123456789,
        "username": "opsbot"
      }
    },
    "slack": {
      "configured": false
    }
  },
  "endpoints": {
    "telegram": "/webhooks/telegram",
    "slack": "/webhooks/slack/events"
  }
}
```

#### POST /webhooks/telegram

Telegram webhook endpoint.

#### GET /webhooks/telegram/info

Get Telegram bot info.

#### POST /webhooks/telegram/setup

Set up Telegram webhook.

**Request:**

```json
{
  "webhookUrl": "https://your-domain.com/webhooks/telegram"
}
```

#### POST /webhooks/slack/events

Slack Events API endpoint.

---

### Heartbeat

#### GET /api/heartbeat

Get current system status report without sending.

**Response:**

```json
{
  "report": "📊 Daily DevOps Report...",
  "generatedAt": "2026-01-28T10:30:00.000Z"
}
```

#### GET /api/heartbeat/preview

Preview the heartbeat message that would be sent.

**Response:**

```json
{
  "preview": "📊 *Daily DevOps Report - Jan 28, 2026*\n\n☸️ *Kubernetes*\n├── Nodes: 3/3 Ready...",
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

#### POST /api/heartbeat/trigger

Manually trigger a heartbeat to be sent via Telegram.

**Request:**

```json
{
  "chatId": "123456789",
  "includeKubernetes": true,
  "includeDocker": true,
  "includeSystem": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Heartbeat sent to chat 123456789",
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "planId": "plan-id-if-applicable"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad request
- `404` - Not found
- `500` - Server error
