# Contributing to ARM

Thank you for your interest in contributing to ARM (Agent Resource Management)! This document provides guidelines and instructions for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- ✅ Be respectful and inclusive
- ✅ Provide constructive feedback
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other contributors

### Unacceptable Behavior

- ❌ Harassment or discriminatory language
- ❌ Trolling or insulting comments
- ❌ Public or private harassment
- ❌ Publishing others' private information

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+
- **Git**: 2.40+
- **Convex CLI**: Latest
- **Code Editor**: VS Code or Cursor (recommended)

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/arm.git
cd arm

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/arm.git

# 4. Install dependencies
pnpm install

# 5. Set up Convex (development)
npx convex dev

# 6. Start UI development server
cd ui && pnpm dev
```

### Project Structure

```
ARM/
├── convex/              # Backend (Convex)
│   ├── schema.ts       # Database schema
│   ├── lib/            # Shared utilities
│   ├── *.ts            # Convex functions (queries/mutations)
│   └── seedARM.ts      # Seed script
├── ui/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── views/      # Page-level components
│   │   ├── lib/        # Utilities
│   │   └── main.tsx    # Entry point
│   └── package.json
├── packages/
│   └── shared/         # Shared TypeScript types
├── docs/               # Documentation
└── _quarantine/        # Legacy code (reference only)
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) and [CLAUDE.md](CLAUDE.md) rules.

**Key Rules:**
- ✅ Immutable genome (never modify `genomeHash`)
- ✅ Write change records for all mutations
- ✅ Use semantic Tailwind tokens
- ✅ Follow state machine rules
- ✅ Add TypeScript types for everything

### 3. Test Your Changes

```bash
# Run linter
pnpm lint

# Fix linter errors
pnpm lint:fix

# Build to check for errors
cd ui && pnpm build

# Test manually in browser
pnpm dev
```

### 4. Commit Changes

Follow [Commit Guidelines](#commit-guidelines).

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add policy evaluation engine"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out the PR template
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types
interface CreateVersionArgs {
  templateId: Id<"agentTemplates">
  versionLabel: string
  genome: AgentGenome
}

// ❌ Bad: Implicit any
function createVersion(args) { ... }
```

### React Components

```typescript
// ✅ Good: Named exports, typed props
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ❌ Bad: Default exports, untyped props
export default function Button(props) { ... }
```

### Convex Functions

```typescript
// ✅ Good: Validated args, change records
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Validation
    if (!args.name.trim()) {
      throw new Error("Name is required")
    }

    // Insert
    const id = await ctx.db.insert("templates", args)

    // Write change record
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "TEMPLATE_CREATED",
      targetEntity: "template",
      targetId: id,
      payload: { name: args.name },
      timestamp: Date.now(),
    })

    return id
  },
})

// ❌ Bad: No validation, no change record
export const create = mutation({
  handler: async (ctx, args: any) => {
    return await ctx.db.insert("templates", args)
  },
})
```

### Styling (Tailwind)

```typescript
// ✅ Good: Semantic tokens
<div className="bg-arm-surface text-arm-text border-arm-border">

// ❌ Bad: Hard-coded colors
<div className="bg-gray-900 text-white border-gray-700">
```

### File Organization

```typescript
// ✅ Good: Imports at top, exports at bottom
import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'

export function MyComponent() {
  // Component logic
}

// ❌ Bad: Scattered imports
import { useState } from 'react'
export function MyComponent() { ... }
import { useQuery } from 'convex/react'
```

---

## Commit Guidelines

### Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat: add policy evaluation engine"

# Bug fix
git commit -m "fix: correct genome hash verification"

# Documentation
git commit -m "docs: update API reference for approvals"

# With scope
git commit -m "feat(ui): add search to DirectoryView"

# With body
git commit -m "feat: implement approval workflows

- Add approvalRecords CRUD
- Add approval engine with state validation
- Add ApprovalsView UI with filters
- Integrate with version transitions"

# Breaking change
git commit -m "feat!: change policy autonomy tier scale

BREAKING CHANGE: Autonomy tiers now use 0-5 scale instead of 0-10"
```

### Commit Message Rules

- ✅ Use imperative mood ("add" not "added")
- ✅ Keep subject line under 72 characters
- ✅ Capitalize first letter
- ✅ No period at end of subject
- ✅ Separate subject and body with blank line
- ✅ Wrap body at 72 characters
- ✅ Use body to explain *what* and *why*, not *how*

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All linter errors resolved
- [ ] Build succeeds (`pnpm build`)
- [ ] Manual testing completed
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention
- [ ] Branch is up to date with `main`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of specific changes
- Use bullet points
- Be specific

## Testing
- How was this tested?
- What scenarios were covered?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated Checks**: CI/CD runs linter and build
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: Maintainer approves PR
5. **Merge**: Squash and merge to `main`

### Addressing Feedback

```bash
# Make changes based on feedback
git add .
git commit -m "fix: address review feedback"

# Push to update PR
git push origin feature/your-feature-name
```

---

## Testing

### Manual Testing

```bash
# 1. Start Convex dev server
npx convex dev

# 2. Run seed script
npx convex run seedARM

# 3. Start UI dev server
cd ui && pnpm dev

# 4. Test in browser
# - Create template
# - Create version
# - Create policy
# - Test approval workflow
```

### Testing Checklist

- [ ] Happy path works
- [ ] Error handling works
- [ ] Edge cases handled
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Toast notifications appear
- [ ] Forms validate correctly
- [ ] State transitions follow rules

### Browser Testing

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Documentation

### When to Update Docs

Update documentation when you:
- Add new features
- Change existing behavior
- Add new API endpoints
- Modify configuration
- Change deployment process

### Documentation Files

- **README.md**: Project overview
- **docs/API_REFERENCE.md**: API documentation
- **docs/DEPLOYMENT.md**: Deployment guide
- **docs/ARCHITECTURE.md**: System design
- **CLAUDE.md**: AI development rules
- **progress.txt**: Development progress

### Documentation Style

```markdown
# ✅ Good: Clear, concise, with examples

## Create a Policy

Use the `policyEnvelopes.create` mutation:

\`\`\`typescript
const policyId = await createPolicy({
  tenantId,
  name: "Standard Policy",
  autonomyTier: 2,
  allowedTools: ["zendesk_search"],
})
\`\`\`

# ❌ Bad: Vague, no examples

## Policies

You can create policies.
```

---

## Getting Help

### Resources

- **Documentation**: [docs/](docs/)
- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code contributions

### Issue Templates

When creating an issue, use the appropriate template:

**Bug Report:**
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.19.0]
```

**Feature Request:**
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions

**Additional context**
Any other context
```

---

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project README (for significant contributions)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ARM!** 🎉

---

**Last Updated:** February 10, 2026  
**Maintainer:** ARM Team
