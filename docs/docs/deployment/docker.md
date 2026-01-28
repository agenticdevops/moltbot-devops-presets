---
sidebar_position: 1
---

# Docker Deployment

Deploy Opsbot using Docker and Docker Compose.

## Quick Start

```bash
cd deploy/docker
docker-compose up -d
```

## Docker Compose

### Basic Setup

Create a `.env` file:

```bash
# Required
ANTHROPIC_API_KEY=your-api-key

# Optional - Telegram
TELEGRAM_BOT_TOKEN=your-bot-token

# Optional - Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_APP_TOKEN=xapp-your-token

# Safety mode
OPSBOT_SAFETY_MODE=plan-mode
```

Start the services:

```bash
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  opsbot:
    build:
      context: ../..
      dockerfile: deploy/docker/Dockerfile
      args:
        INSTALL_KUBECTL: "true"
        INSTALL_GH: "true"
    image: opsbot:latest
    container_name: opsbot
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPSBOT_SAFETY_MODE=${OPSBOT_SAFETY_MODE:-plan-mode}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
    volumes:
      - opsbot-data:/app/data
      - opsbot-memory:/app/memory
      - ${HOME}/.kube:/home/opsbot/.kube:ro
      - ${HOME}/.aws:/home/opsbot/.aws:ro
    restart: unless-stopped

volumes:
  opsbot-data:
  opsbot-memory:
```

## Building the Image

### With CLI Tools

Build with kubectl and gh CLI:

```bash
docker build \
  --build-arg INSTALL_KUBECTL=true \
  --build-arg INSTALL_GH=true \
  -t opsbot:latest .
```

### All Tools

```bash
docker build \
  --build-arg INSTALL_KUBECTL=true \
  --build-arg INSTALL_TERRAFORM=true \
  --build-arg INSTALL_AWS=true \
  --build-arg INSTALL_GH=true \
  -t opsbot:full .
```

### Minimal (No Tools)

```bash
docker build -t opsbot:minimal .
```

## Volume Mounts

### Credentials

Mount cloud credentials for CLI access:

```yaml
volumes:
  # Kubernetes
  - ${HOME}/.kube:/home/opsbot/.kube:ro

  # AWS
  - ${HOME}/.aws:/home/opsbot/.aws:ro

  # Google Cloud
  - ${HOME}/.config/gcloud:/home/opsbot/.config/gcloud:ro

  # Azure
  - ${HOME}/.azure:/home/opsbot/.azure:ro
```

### Persistent Data

```yaml
volumes:
  # Execution plans and audit logs
  - opsbot-data:/app/data
  - opsbot-memory:/app/memory

  # Or host paths
  - ./data:/app/data
  - ./memory:/app/memory
```

### Custom Configuration

```yaml
volumes:
  - ./config.json:/app/config.json:ro
```

## Health Checks

The container includes built-in health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

## Logs

View container logs:

```bash
# Follow logs
docker logs -f opsbot

# Last 100 lines
docker logs --tail 100 opsbot

# Since specific time
docker logs --since 1h opsbot
```

## Updating

```bash
# Pull latest
docker-compose pull

# Rebuild from source
docker-compose build --no-cache

# Restart with new image
docker-compose up -d
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs opsbot

# Check if port is in use
lsof -i :3000

# Start interactively
docker run -it --rm opsbot:latest /bin/bash
```

### Permission denied

```bash
# Check file permissions
ls -la ~/.kube
ls -la ~/.aws

# Ensure readable
chmod 644 ~/.kube/config
chmod 644 ~/.aws/credentials
```

### Out of memory

```bash
# Increase memory limit
docker run -m 1g opsbot:latest
```
