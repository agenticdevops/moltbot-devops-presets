---
sidebar_position: 1
---

# Architecture

Understanding Opsbot's internal architecture.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Channels                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │Telegram │  │  Slack  │  │  Teams  │  │   TUI   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server (Elysia)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Health  │  │  Plans  │  │Approvals│  │Webhooks │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Safety Layer                                │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐         │
│  │  Classifier  │  │Plan Generator │  │   Approval   │         │
│  │              │  │               │  │   Handler    │         │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                            ▼                                     │
│              ┌─────────────────────────┐                        │
│              │        Executor         │                        │
│              └─────────────────────────┘                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Audit Logger                               │
│                    (JSONL Append-Only)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Packages

### @opsbot/contracts

Zod schemas and TypeScript types shared across packages.

```
packages/contracts/
├── src/
│   ├── safety/           # Plan, approval, risk schemas
│   ├── config/           # Configuration schemas
│   ├── skills/           # Skill definition schemas
│   └── execution/        # Execution plan schemas
```

### @opsbot/safety

Safety layer implementation.

```
packages/opsbot-safety/
├── src/
│   ├── command-classifier.ts   # Classify read vs mutating
│   ├── plan-generator.ts       # Create plans (legacy)
│   └── execution/
│       ├── plan-generator.ts   # Structured plan generation
│       ├── approval-handler.ts # Approval workflow
│       ├── executor.ts         # Plan execution
│       └── audit-logger.ts     # JSONL logging
```

### @opsbot/skills

DevOps skills in markdown format.

```
packages/opsbot-skills/
├── skills/
│   ├── docker/skill.md
│   ├── kubernetes/skill.md
│   ├── terraform/skill.md
│   ├── github/skill.md
│   ├── k8s-debug/skill.md
│   ├── aws-ops/skill.md
│   ├── incident-response/skill.md
│   ├── system-health/skill.md
│   └── log-analysis/skill.md
```

### @opsbot/presets

Preconfigured profiles.

```
packages/opsbot-presets/
├── presets/
│   ├── read-only.json
│   ├── plan-mode.json
│   └── gitops.json
```

## Apps

### @opsbot/cli

Command-line interface.

```
apps/cli/
├── src/
│   ├── index.ts
│   └── commands/
│       ├── setup.ts     # Setup wizard
│       └── doctor.ts    # Tool detection
```

### @opsbot/server

Elysia API server.

```
apps/server/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── plans.ts
│   │   ├── approvals.ts
│   │   └── webhooks.ts
│   └── channels/
│       └── telegram/
│           ├── bot.ts
│           └── commands.ts
```

## Data Flow

### Plan Creation

```
1. User request (Telegram/API)
2. Command classification
3. Risk assessment
4. Plan generation
5. Store plan (JSON file)
6. Present for review
```

### Approval Flow

```
1. User reviews plan
2. Approve/Reject decision
3. Update plan status
4. Log to audit trail
5. Notify via channel
```

### Execution Flow

```
1. Verify plan approved
2. Run pre-flight checks
3. Execute steps sequentially
4. Handle errors (rollback if needed)
5. Run post-execution checks
6. Update plan status
7. Log results
```

## Storage

### Plans

Plans are stored as JSON files:

```
memory/execution-plans/
├── plan-20260128-001.json
├── plan-20260128-002.json
└── ...
```

### Audit Log

Append-only JSONL format:

```
memory/audit-log.jsonl
```

Each line is a JSON object:

```json
{"timestamp":"2026-01-28T10:30:00Z","planId":"plan-20260128-001","action":"plan_approved",...}
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun / Node.js 22+ |
| API Server | Elysia |
| Validation | Zod |
| CLI | Commander.js |
| Telegram | Native fetch API |
| Docs | Docusaurus |
