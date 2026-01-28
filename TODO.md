# TODO - Deferred Features

This document tracks features and enhancements planned for future releases.

## Channels

### MS Teams Integration
- [ ] Teams Bot setup with Bot Framework
- [ ] Adaptive Cards for plan presentation
- [ ] Approval workflow via Teams
- [ ] Channel/conversation routing

### Slack Enhancements
- [ ] Interactive message blocks
- [ ] Slash commands (/opsbot)
- [ ] Home tab with dashboard
- [ ] Workflow builder integration

## Skills

### Cloud Providers
- [ ] **gcp-ops** - GCP infrastructure (Compute, GKE, Cloud Run, Logging)
- [ ] **azure-ops** - Azure infrastructure (VMs, AKS, Functions, Monitor)

### Observability
- [ ] **prometheus** - PromQL queries, alert rules
- [ ] **grafana** - Dashboard API, annotations
- [ ] **datadog** - Metrics, logs, monitors
- [ ] **pagerduty** - Incidents, on-call management

### Configuration Management
- [ ] **ansible** - Playbook execution
- [ ] **helm** - Chart management, releases
- [ ] **argocd** - GitOps sync, app management

### Cost Management
- [ ] **cost-optimization** - Cloud cost analysis, recommendations

## GitOps Integration

- [ ] PR-based change management
  - [ ] Create branch for changes
  - [ ] Generate manifest updates
  - [ ] Open PR with diff
  - [ ] Auto-merge after approval
- [ ] ArgoCD/Flux integration
  - [ ] Sync status monitoring
  - [ ] Sync triggering
  - [ ] Rollback via Git revert
- [ ] Terraform Cloud integration
  - [ ] Run triggers
  - [ ] Plan review in chat
  - [ ] Apply approval

## Desktop App (Tauri)

- [ ] Cross-platform desktop application
- [ ] System tray integration
- [ ] Native notifications
- [ ] DOM reparenting for terminal persistence
- [ ] Local LLM support (ollama)
- [ ] Offline mode with cached responses

## Safety Enhancements

- [ ] Multi-approver workflows (require N approvals)
- [ ] Time-based auto-expiry for plans
- [ ] Approval delegation
- [ ] Emergency override audit
- [ ] Integration with change management systems (ServiceNow, Jira)

## API Enhancements

- [ ] WebSocket real-time updates
- [ ] GraphQL API
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Webhook retry with exponential backoff

## Observability

- [ ] OpenTelemetry tracing
- [ ] Prometheus metrics endpoint
- [ ] Structured logging with correlation IDs
- [ ] Audit log export to external systems

## Documentation

- [ ] Video tutorials
- [ ] Interactive playground
- [ ] Skill development guide
- [ ] Plugin development guide
- [ ] Security hardening guide

## Testing

- [ ] E2E tests with real infrastructure
- [ ] Load testing
- [ ] Chaos engineering integration
- [ ] Security scanning (SAST, DAST)

---

*Last updated: 2026-01-28*
