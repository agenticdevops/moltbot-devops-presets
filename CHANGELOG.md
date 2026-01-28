# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-28

### Changed

- **Renamed to moltbot-devops-presets** - Better reflects the project's purpose as a preset pack for Clawdbot/Moltbot
- **Major Architecture Pivot**: Now a preset pack for Clawdbot instead of a standalone application
- Removed custom server, safety layer, and Telegram integration (use Clawdbot's built-in features)
- Simplified to just presets + setup script

### Added

- **Safety Presets** for Clawdbot:
  - `devops-safe.json` - Read-only mode with strict allowlist
  - `devops-standard.json` - Approval required for mutations (recommended)
  - `devops-full.json` - Full access (dangerous!)

- **Setup Script** (`scripts/setup.sh`):
  - Installs Clawdbot if not present
  - Clones and symlinks agentic-ops-skills
  - Applies selected safety preset
  - Interactive safety mode selection

### Removed

- `packages/*` - Custom contracts, safety layer, skills (use Clawdbot's)
- `apps/*` - Custom server and CLI (use Clawdbot)
- `deploy/*` - Docker/Kubernetes manifests (just run Clawdbot)

### Deprecated

- Standalone version archived to `opsbot-standalone` branch

## [0.1.0] - 2026-01-28

### Added

- Initial standalone project structure with monorepo setup
- `@opsbot/contracts` - Zod schemas for safety, config, and skills
- `@opsbot/skills` - DevOps skills: docker, kubernetes, terraform, github
- `@opsbot/safety` - Command classifier, plan generator, approval handler
- `@opsbot/presets` - Preconfigured profiles: read-only, plan-mode, gitops
- `@opsbot/cli` - CLI with setup wizard and doctor commands
- Elysia server with REST API
- Telegram bot integration
- Docker and Kubernetes deployment manifests
- Docusaurus documentation site

**Note**: v0.1.0 is preserved in the `opsbot-standalone` branch.

[0.2.0]: https://github.com/agenticdevops/moltbot-devops-presets/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/agenticdevops/moltbot-devops-presets/releases/tag/v0.1.0
