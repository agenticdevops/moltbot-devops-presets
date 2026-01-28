---
sidebar_position: 3
---

# Approval Workflow

Understanding the plan-review-approve workflow in Opsbot.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Request                             │
│              "Scale production to 5 replicas"                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Analysis                          │
│  • Parse command                                             │
│  • Classify risk level                                       │
│  • Identify affected resources                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Generate Plan                             │
│  • Create structured plan                                    │
│  • Add rollback procedure                                    │
│  • Set validation checks                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Present for Review                         │
│  • Show plan details                                         │
│  • Wait for approval                                         │
│  • Timeout after configured duration                         │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │APPROVED │     │REJECTED │     │ TIMEOUT │
        │         │     │         │     │         │
        └────┬────┘     └────┬────┘     └────┬────┘
             │               │               │
             ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │ Execute │     │  Log &  │     │  Expire │
        │  Plan   │     │ Notify  │     │  Plan   │
        └─────────┘     └─────────┘     └─────────┘
```

## Plan Lifecycle

### States

| State | Description |
|-------|-------------|
| `pending` | Awaiting approval |
| `approved` | Approved, ready to execute |
| `rejected` | Rejected by approver |
| `expired` | Timed out without decision |
| `in_progress` | Currently executing |
| `completed` | Successfully executed |
| `failed` | Execution failed |
| `rolled_back` | Rolled back after failure |

### State Transitions

```
pending → approved → in_progress → completed
                                 → failed → rolled_back
        → rejected
        → expired
```

## Approval Actions

### Approve

Marks the plan as approved and ready for execution.

```bash
# Telegram
/approve plan-20260128-001 Looks good

# API
POST /api/approvals/plan-20260128-001/approve
{
  "approver": "username",
  "comment": "Looks good"
}
```

### Reject

Cancels the plan with a reason.

```bash
# Telegram
/reject plan-20260128-001 Not needed anymore

# API
POST /api/approvals/plan-20260128-001/reject
{
  "approver": "username",
  "reason": "Not needed anymore"
}
```

### Execute

Runs an approved plan.

```bash
# Telegram
/execute plan-20260128-001

# API
POST /api/approvals/plan-20260128-001/execute
```

### Rollback

Reverts changes from an executed plan.

```bash
# API only
POST /api/approvals/plan-20260128-001/rollback
```

## CRITICAL Operations

CRITICAL risk plans require explicit override:

```bash
# Regular approve fails
/approve plan-xxx
⛔ CRITICAL plans require explicit override.
Use: /approve-critical plan-xxx

# With override (API)
POST /api/approvals/plan-xxx/approve
{
  "approver": "username",
  "override": true,
  "comment": "Emergency fix approved by SRE lead"
}
```

## Audit Trail

All actions are logged to an immutable audit trail:

```json
{
  "timestamp": "2026-01-28T10:30:00Z",
  "planId": "plan-20260128-001",
  "action": "plan_approved",
  "riskLevel": "MEDIUM",
  "status": "success",
  "approver": "username",
  "notes": "Approved via Telegram"
}
```

View audit log:

```bash
# Telegram
/audit

# API
GET /api/approvals/audit?limit=20
```

## Plan Expiration

Plans expire after the configured timeout (default: 5 minutes):

```json
{
  "safety": {
    "planTimeoutSec": 300
  }
}
```

Expired plans cannot be approved or executed.

## Best Practices

1. **Review thoroughly** - Read the entire plan before approving
2. **Check rollback** - Ensure rollback procedure is viable
3. **Verify resources** - Confirm affected resources are correct
4. **Add comments** - Document why you approved/rejected
5. **Don't rush** - Take time especially for HIGH/CRITICAL plans
6. **Audit regularly** - Review audit logs for patterns
