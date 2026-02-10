# AI Tooling Quick Start Guide

**TL;DR:** ARM now has access to 178+ AI agents, 65+ skills, and AI-powered task management.

---

## ⚡ 30-Second Setup

```bash
# 1. Install Taskmaster (optional but recommended)
npm install -g @taskmaster-ai/cli

# 2. Initialize in ARM project
task-master init --name="ARM" --description="Agent Resource Management Platform"

# 3. Parse PRD to generate tasks
task-master parse-prd docs/PRD.md

# 4. Start working
task-master next
```

---

## 🎯 What You Get

| Resource | Count | Location |
|----------|-------|----------|
| **AI Agents** | 178+ | `.claude/agents/` (from baseline-project) |
| **Claude Skills** | 65+ | `.claude/skills/` (from baseline-project) |
| **Slash Commands** | 49+ | `.claude/commands/` (from baseline-project) |
| **Taskmaster** | ✅ | AI-powered task management |
| **Compound Workflows** | ✅ | Knowledge compounding |

---

## 🚀 Common Workflows

### 1. Feature Development

```bash
# Plan
task-master add-task --prompt="Implement policy evaluation engine"
task-master expand --id=<task-id>

# Implement (use AI agents in Cursor/Claude Code IDE)
# Select appropriate agent from agent picker

# Review
/workflows:review #PR

# Document
/workflows:compound "policy evaluation patterns"

# Complete
task-master set-status --id=<task-id> --status=done
```

### 2. Bug Fixing

```bash
# Create task
task-master add-task --prompt="Fix version drawer scroll issue"

# Debug (use debugging agents)
# Update task with findings
task-master update-task --id=<task-id> --prompt="Root cause: CSS overflow"

# Mark complete
task-master set-status --id=<task-id> --status=done
```

### 3. Code Review

```bash
# Use review agents
/review

# Multi-agent review (Compound)
/workflows:review #PR

# Browser testing
/test-browser #PR
```

---

## 📚 Essential Commands

### Taskmaster (Project-Level)

```bash
task-master list                    # List all tasks
task-master next                    # Get next task
task-master show <id>               # View task details
task-master expand --id=<id>        # Break down into subtasks
task-master set-status --id=<id> --status=done  # Mark complete
```

### Compound Workflows (Implementation-Level)

```bash
# In Cursor/Claude Code IDE:
/workflows:plan "feature"           # Create detailed plan
/workflows:work                     # Execute with git worktrees
/workflows:review #PR               # Multi-agent code review
/workflows:compound "learning"      # Document knowledge
/test-browser #PR                   # Browser testing
```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **[AI_TOOLING_INTEGRATION.md](AI_TOOLING_INTEGRATION.md)** | Complete guide (read this first) |
| **[.cursorrules](.cursorrules)** | Cursor rules with AI tooling |
| **[BASELINE_PROJECT_INTEGRATION.md](BASELINE_PROJECT_INTEGRATION.md)** | Integration summary |
| **[CLAUDE.md](CLAUDE.md)** | AI operating manual |

---

## 🎓 Learning Path

### Day 1: Basics
1. Read `AI_TOOLING_INTEGRATION.md`
2. Install Taskmaster
3. Parse PRD to generate tasks
4. Explore available agents

### Day 2: Workflows
1. Use Taskmaster for task management
2. Try slash commands in Cursor/Claude Code IDE
3. Use AI agents for specialized tasks

### Day 3: Advanced
1. Install Compound Engineering Plugin (optional)
2. Use compound workflows
3. Create custom agents/skills for ARM

---

## 🔗 External Resources

- [Baseline Project](https://github.com/jaydubya818/baseline-project) - AI tooling source
- [Taskmaster Docs](https://github.com/taskmaster-ai/taskmaster) - Task management
- [Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin) - Workflows

---

## ❓ FAQ

**Q: Do I need to clone the baseline-project?**  
A: No, the documentation is integrated. Clone it only if you want to explore the agents/skills.

**Q: Is Taskmaster required?**  
A: No, but highly recommended for AI-powered task management.

**Q: Can I use this with my existing workflow?**  
A: Yes! The AI tooling complements your existing workflow.

**Q: What if I don't use Cursor or Claude Code IDE?**  
A: You can still use Taskmaster. The agents/skills work best with AI-powered IDEs.

---

**Last Updated:** February 10, 2026  
**Status:** ✅ Ready to use
