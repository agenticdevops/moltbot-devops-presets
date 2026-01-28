---
sidebar_position: 3
---

# Creating Skills

Guide to creating custom DevOps skills for Opsbot.

## Skill Structure

Skills are markdown files with YAML frontmatter:

```
packages/opsbot-skills/skills/<skill-name>/
└── skill.md
```

## Skill Format

### Basic Template

```markdown
---
name: my-skill
description: "Brief description of what this skill does and when to use it."
metadata:
  opsbot:
    emoji: "🔧"
    tags: ["category1", "category2"]
    requires:
      bins: ["required-binary"]
    install:
      - id: brew
        kind: brew
        formula: formula-name
        bins: ["binary-name"]
---

# Skill Title

Introduction to the skill.

## Read-Only Operations (Safe)

\`\`\`bash
# Safe commands that only read data
command --list
\`\`\`

## Mutating Operations (Require Approval)

\`\`\`bash
# Commands that modify state
command --update
\`\`\`

## Dangerous Operations (Always Require Approval)

\`\`\`bash
# Destructive commands
command --delete-all
\`\`\`

## Safety Notes

- Important safety considerations
- Best practices
```

## Frontmatter Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Lowercase, hyphens allowed (e.g., `my-skill`) |
| `description` | string | When to use this skill |

### Metadata

```yaml
metadata:
  opsbot:
    emoji: "🔧"              # Display emoji
    tags: ["devops", "k8s"]  # Categorization
    requires:
      bins: ["kubectl"]      # Required binaries
      anyBins: ["a", "b"]    # At least one required
      env: ["API_KEY"]       # Required env vars
    install:                 # Installation methods
      - id: brew
        kind: brew
        formula: kubectl
        bins: ["kubectl"]
```

### Install Methods

| Kind | Fields | Description |
|------|--------|-------------|
| `brew` | `formula`, `bins` | Homebrew formula |
| `apt` | `package`, `bins` | APT package |
| `npm` | `package`, `bins` | NPM package |
| `pip` | `package`, `bins` | Python package |
| `manual` | `url`, `instructions` | Manual installation |

## Content Guidelines

### Structure

1. **Introduction** - What the skill does
2. **Read-Only Operations** - Safe commands
3. **Mutating Operations** - Commands that change state
4. **Dangerous Operations** - Destructive commands
5. **Safety Notes** - Best practices

### Command Documentation

For each command, include:

```markdown
### Operation Name

\`\`\`bash
# What this does
command --flag <placeholder>
\`\`\`

**Options:**
- `--flag`: Description

**Example:**
\`\`\`bash
command --flag value
\`\`\`
```

### Placeholders

Use angle brackets for user-provided values:

```bash
kubectl get pod <pod-name> -n <namespace>
docker logs <container>
aws ec2 describe-instances --instance-ids <instance-id>
```

## Example: Custom Skill

```markdown
---
name: redis-cli
description: "Interact with Redis databases using redis-cli. Use for cache management, key inspection, and data operations."
metadata:
  opsbot:
    emoji: "🔴"
    tags: ["redis", "database", "cache"]
    requires:
      bins: ["redis-cli"]
    install:
      - id: brew
        kind: brew
        formula: redis
        bins: ["redis-cli"]
      - id: apt
        kind: apt
        package: redis-tools
        bins: ["redis-cli"]
---

# Redis CLI Skill

Manage Redis databases using the `redis-cli` command.

## Connection

\`\`\`bash
# Connect to Redis
redis-cli -h <host> -p <port>

# With authentication
redis-cli -h <host> -p <port> -a <password>
\`\`\`

## Read-Only Operations (Safe)

\`\`\`bash
# Ping server
redis-cli ping

# Get key
redis-cli GET <key>

# List keys
redis-cli KEYS <pattern>

# Check key type
redis-cli TYPE <key>

# Get TTL
redis-cli TTL <key>

# Server info
redis-cli INFO
\`\`\`

## Mutating Operations (Require Approval)

\`\`\`bash
# Set key
redis-cli SET <key> <value>

# Set with expiry
redis-cli SETEX <key> <seconds> <value>

# Delete key
redis-cli DEL <key>

# Expire key
redis-cli EXPIRE <key> <seconds>
\`\`\`

## Dangerous Operations (Always Require Approval)

\`\`\`bash
# Flush current database
redis-cli FLUSHDB

# Flush all databases
redis-cli FLUSHALL

# Delete keys by pattern
redis-cli KEYS "<pattern>" | xargs redis-cli DEL
\`\`\`

## Safety Notes

- Always use specific keys, avoid wildcards in production
- FLUSHDB/FLUSHALL are irreversible
- Use TTL to prevent memory issues
- Monitor memory usage with INFO memory
```

## Testing Skills

1. Add skill to `packages/opsbot-skills/skills/`
2. Verify binary requirements are met
3. Test commands manually
4. Check skill loads correctly

## Best Practices

1. **Be specific** - Include exact commands
2. **Show examples** - Real-world usage
3. **Document flags** - Explain options
4. **Warn about dangers** - Highlight destructive commands
5. **Provide alternatives** - Safer ways to achieve goals
6. **Keep updated** - Match tool versions
