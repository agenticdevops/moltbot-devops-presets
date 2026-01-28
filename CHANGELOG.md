# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Execution engine integration from devops-execution-engine
  - Plan generator with structured YAML-based plans
  - Approval handler with risk-based workflow
  - Executor with timeout handling and rollback support
  - Audit logger with JSONL append-only trail
- Execution plan schemas in @opsbot/contracts
- Docker deployment support
  - Multi-stage Dockerfile with optional CLI tool installation
  - docker-compose.yml for local development
- Kubernetes deployment manifests
  - Namespace, ConfigMap, Secret, Deployment, Service
  - RBAC with read-only ClusterRole (safe default)
  - PersistentVolumeClaims for data and memory
  - Kustomization for easy customization
- Elysia server with REST API
  - Health check endpoints (/health, /health/ready, /health/live)
  - Plans API (create, list, get, delete)
  - Approvals API (approve, reject, execute, rollback)
  - Webhooks for Slack and Telegram integration
  - Audit log API

## [0.1.0] - 2026-01-28

### Added

- Initial project structure with monorepo setup
- `@opsbot/contracts` - Zod schemas for safety, config, and skills
- `@opsbot/skills` - DevOps skills: docker, kubernetes, terraform, github
- `@opsbot/safety` - Command classifier and plan generator for safety layer
- `@opsbot/presets` - Preconfigured profiles: read-only, plan-mode, gitops
- `@opsbot/cli` - CLI with setup wizard and doctor commands
- Safety modes: read-only, plan-mode, full-access
- Plan → review → approve workflow for mutations
- Command classification for read vs mutating operations

### Skills

- **docker** - Container lifecycle, logs, exec, build, prune
- **kubernetes** - Pod management, logs, apply, scale, rollout
- **terraform** - Plan, apply, destroy, state management
- **github** - PRs, issues, releases, actions, workflows

[Unreleased]: https://github.com/agenticdevops/opsbot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/agenticdevops/opsbot/releases/tag/v0.1.0
