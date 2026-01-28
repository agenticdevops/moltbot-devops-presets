---
sidebar_position: 4
---

# Contributing

Guide to contributing to Opsbot.

## Getting Started

### Prerequisites

- Node.js 22+ or Bun 1.1+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/agenticdevops/opsbot.git
cd opsbot

# Install dependencies
bun install

# Build all packages
bun run build
```

### Development

```bash
# Run server in development mode
bun run --filter @opsbot/server dev

# Run CLI
bun run --filter @opsbot/cli dev
```

## Project Structure

```
opsbot/
├── packages/
│   ├── contracts/        # Zod schemas and types
│   ├── opsbot-safety/    # Safety layer
│   ├── opsbot-skills/    # DevOps skills
│   └── opsbot-presets/   # Configuration presets
├── apps/
│   ├── cli/              # CLI application
│   └── server/           # API server
├── deploy/
│   ├── docker/           # Docker files
│   └── kubernetes/       # K8s manifests
└── docs/                 # Documentation (Docusaurus)
```

## Making Changes

### Contracts First

When adding new features, start with schemas:

1. Add Zod schema in `packages/contracts/src/`
2. Export from appropriate index file
3. Use types in implementation

### Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Commit Messages

Follow conventional commits:

```
feat: add new skill for prometheus
fix: handle timeout in executor
docs: update API reference
chore: update dependencies
```

## Adding a Skill

1. Create skill directory:

```bash
mkdir packages/opsbot-skills/skills/my-skill
```

2. Create `skill.md`:

```markdown
---
name: my-skill
description: "Description here"
metadata:
  opsbot:
    emoji: "🔧"
    requires:
      bins: ["my-binary"]
---

# My Skill

Content here...
```

3. Test the skill works with the binary

4. Submit PR

## Adding an API Endpoint

1. Create route in `apps/server/src/routes/`
2. Add Zod validation schemas
3. Register route in `index.ts`
4. Update API documentation

## Testing

```bash
# Run tests
bun test

# Run specific package tests
bun run --filter @opsbot/safety test
```

## Documentation

Documentation uses Docusaurus.

```bash
# Start docs dev server
cd docs
bun run start

# Build docs
bun run build
```

### Adding Docs

1. Create markdown file in `docs/docs/`
2. Add to `sidebars.ts`
3. Use frontmatter for metadata

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update documentation
5. Submit PR

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] PR description explains changes

## Reporting Issues

Use GitHub Issues for:

- Bug reports
- Feature requests
- Documentation improvements

Include:

- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details

## Code of Conduct

- Be respectful
- Be constructive
- Welcome newcomers
- Focus on the code, not the person

## License

Opsbot is MIT licensed. By contributing, you agree to license your contributions under MIT.
