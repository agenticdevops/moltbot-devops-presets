# Opsbot - DevOps assistant with safety-first design
# Multi-stage build for minimal image size

# Build stage
FROM oven/bun:1.1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/opsbot-skills/package.json ./packages/opsbot-skills/
COPY packages/opsbot-safety/package.json ./packages/opsbot-safety/
COPY packages/opsbot-presets/package.json ./packages/opsbot-presets/
COPY apps/cli/package.json ./apps/cli/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY . .

# Build all packages
RUN bun run build || true

# Runtime stage
FROM oven/bun:1.1-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Optional: Install DevOps CLI tools
# Uncomment the tools you need:
ARG INSTALL_KUBECTL=false
ARG INSTALL_TERRAFORM=false
ARG INSTALL_AWS=false
ARG INSTALL_GH=false

# Install kubectl
RUN if [ "$INSTALL_KUBECTL" = "true" ]; then \
      curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
      install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
      rm kubectl; \
    fi

# Install terraform
RUN if [ "$INSTALL_TERRAFORM" = "true" ]; then \
      curl -LO "https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip" && \
      unzip terraform_1.7.0_linux_amd64.zip && \
      install -o root -g root -m 0755 terraform /usr/local/bin/terraform && \
      rm terraform terraform_1.7.0_linux_amd64.zip; \
    fi

# Install AWS CLI
RUN if [ "$INSTALL_AWS" = "true" ]; then \
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
      unzip awscliv2.zip && \
      ./aws/install && \
      rm -rf awscliv2.zip aws; \
    fi

# Install GitHub CLI
RUN if [ "$INSTALL_GH" = "true" ]; then \
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
      apt-get update && apt-get install -y gh && \
      rm -rf /var/lib/apt/lists/*; \
    fi

# Create app user for security
RUN groupadd -r opsbot && useradd -r -g opsbot opsbot

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/opsbot-skills/skills ./skills
COPY --from=builder /app/packages/opsbot-presets/presets ./presets
COPY --from=builder /app/package.json ./

# Create data directories
RUN mkdir -p /app/data /app/memory && \
    chown -R opsbot:opsbot /app

# Switch to non-root user
USER opsbot

# Environment variables
ENV NODE_ENV=production
ENV OPSBOT_DATA_DIR=/app/data
ENV OPSBOT_MEMORY_DIR=/app/memory

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Default command
CMD ["bun", "run", "dist/apps/server/index.js"]
