---
sidebar_position: 2
---

# Safety Modes

Opsbot provides three safety modes to balance speed and control.

## Overview

| Mode | Description | Best For |
|------|-------------|----------|
| `read-only` | Only view operations allowed | Monitoring, exploration |
| `plan-mode` | Review before execute | Production operations |
| `full-access` | Direct execution | Development, trusted environments |

## Read-Only Mode

The safest mode - no mutations allowed.

### Allowed Operations

- View pod status, logs, events
- Describe resources
- List resources
- Query metrics
- Read configurations

### Blocked Operations

- Create, update, delete resources
- Scale deployments
- Apply manifests
- Execute commands in containers

### Configuration

```json
{
  "safety": {
    "mode": "read-only"
  },
  "exec": {
    "security": "allowlist",
    "onMiss": "deny"
  }
}
```

## Plan Mode (Recommended)

Balanced mode - review before execute.

### Workflow

```
User Request → Command Classification → Plan Generation → Review → Approve/Reject → Execute
```

### Risk Levels

| Level | Emoji | Description | Approval |
|-------|-------|-------------|----------|
| LOW | 🟢 | Read operations, safe writes | Optional (can auto-approve) |
| MEDIUM | 🟡 | Modifications with rollback | Required |
| HIGH | 🔴 | Significant changes | Required |
| CRITICAL | ⛔ | Destructive operations | Required + Override |

### Configuration

```json
{
  "safety": {
    "mode": "plan-mode",
    "planTimeoutSec": 300,
    "alwaysRequireApproval": ["delete", "destroy", "terminate"],
    "autoApproveLowRisk": false
  }
}
```

### Example Plan

```
═══════════════════════════════════════════════════════════
📋 EXECUTION PLAN: plan-20260128-001
═══════════════════════════════════════════════════════════

Title: Scale API deployment
Risk Level: 🟡 MEDIUM
Estimated Duration: 2 minutes

────────────────────────────────────────────────────────────
CONTEXT
────────────────────────────────────────────────────────────
Issue: High traffic causing slow responses
Affected Resources:
  - deployment/api-service (ns: production)

────────────────────────────────────────────────────────────
EXECUTION STEPS
────────────────────────────────────────────────────────────
step-1: Scale deployment to 5 replicas
    Action: kubectl scale
    Command: kubectl scale deployment/api-service --replicas=5 -n production
    Risk: 🟡 MEDIUM | Reversible: Yes

────────────────────────────────────────────────────────────
ROLLBACK PLAN
────────────────────────────────────────────────────────────
Method: Scale back to original count
Commands:
  - kubectl scale deployment/api-service --replicas=3 -n production

═══════════════════════════════════════════════════════════
DECISION REQUIRED
═══════════════════════════════════════════════════════════
Reply with one of:
  • approve / yes - Execute this plan
  • reject [reason] - Cancel this plan
  • explain [step-id] - Get more details
═══════════════════════════════════════════════════════════
```

## Full-Access Mode

Direct execution without approval gates.

:::warning
Only use in development or fully trusted environments.
:::

### Configuration

```json
{
  "safety": {
    "mode": "full-access"
  },
  "exec": {
    "security": "open"
  }
}
```

## Command Classification

Opsbot automatically classifies commands:

### Read Operations (Safe)

```bash
kubectl get pods
kubectl describe deployment
kubectl logs pod-name
docker ps
docker logs container
terraform plan
terraform show
aws ec2 describe-instances
```

### Mutating Operations (Plan Required)

```bash
kubectl apply -f manifest.yaml
kubectl scale deployment
kubectl delete pod
docker stop container
terraform apply
aws ec2 start-instances
```

### Dangerous Operations (Always Require Approval)

```bash
kubectl delete namespace
kubectl delete --all
docker system prune
terraform destroy
aws ec2 terminate-instances
rm -rf
```

## Best Practices

1. **Start with read-only** for exploration
2. **Use plan-mode** for production
3. **Never use full-access** in production
4. **Review all HIGH/CRITICAL plans carefully**
5. **Use dry-run flags** when available
6. **Keep audit logs** for compliance
