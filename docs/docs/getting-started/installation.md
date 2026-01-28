---
sidebar_position: 2
---

# Installation

Detailed installation instructions for different environments.

## System Requirements

- **Runtime**: Node.js 22+ or Bun 1.1+
- **Memory**: 256MB minimum, 512MB recommended
- **Storage**: 1GB for data and logs

## Installation Methods

### From Source

```bash
# Clone repository
git clone https://github.com/agenticdevops/opsbot.git
cd opsbot

# Install dependencies
bun install

# Build all packages
bun run build

# Run the server
bun run apps/server/src/index.ts
```

### Docker

```bash
# Using docker-compose (recommended)
cd deploy/docker
docker-compose up -d

# Or manually
docker run -d \
  --name opsbot \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  -v opsbot-data:/app/data \
  ghcr.io/agenticdevops/opsbot:latest
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -k deploy/kubernetes/

# Or with kustomize
kustomize build deploy/kubernetes | kubectl apply -f -
```

## Optional CLI Tools

Opsbot works best with these tools installed:

| Tool | Purpose | Install |
|------|---------|---------|
| `kubectl` | Kubernetes management | `brew install kubectl` |
| `docker` | Container management | `brew install docker` |
| `terraform` | Infrastructure as Code | `brew install terraform` |
| `gh` | GitHub CLI | `brew install gh` |
| `aws` | AWS CLI | `brew install awscli` |

## Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","version":"0.1.0",...}

# Check webhook health
curl http://localhost:3000/webhooks/health
```

## Troubleshooting

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Use different port
PORT=3001 bun run apps/server/src/index.ts
```

### Permission denied

```bash
# Ensure config directory exists with correct permissions
mkdir -p ~/.opsbot
chmod 700 ~/.opsbot
```

### Docker build fails

```bash
# Clear Docker cache
docker builder prune

# Build with no cache
docker build --no-cache -t opsbot .
```
