# ARM - Spec Driven Development (SDD) System

**Status:** ✅ Complete  
**Created:** February 10, 2026  
**Purpose:** Documentation-first development system for ARM

---

## System Overview

ARM uses a **Documentation-First System** (Spec Driven Development) where all canonical documentation is written before any code. This prevents AI hallucinations, scope drift, and architectural inconsistencies.

---

## The 8 Core Documents

### 📚 Canonical Docs (6 files) - Knowledge Base

These documents define **what** ARM is, **how** it works, and **what** to build.

#### 1. PRD.md (Product Requirements Document)
**Purpose:** Source of truth for product scope  
**Contains:**
- Product vision and goals
- In-scope features (P1.1, P1.2, P2.0)
- Explicitly out-of-scope items
- User stories with acceptance criteria
- Success metrics
- Non-goals and constraints

**When to Read:** Before starting any new feature  
**When to Update:** When adding/removing features, changing scope

---

#### 2. APP_FLOW.md (Application Flow)
**Purpose:** Complete user journey documentation  
**Contains:**
- Screen inventory (all views)
- User flows (step-by-step)
- Navigation map
- Decision points (when to show what)
- Error handling patterns
- Success feedback patterns

**When to Read:** Before implementing any UI  
**When to Update:** When adding views, changing flows, adding interactions

---

#### 3. TECH_STACK.md (Technology Stack)
**Purpose:** Exact versions and dependencies  
**Contains:**
- All dependencies with exact versions
- Package manager configuration
- Build tools and commands
- Environment variables
- File structure
- Forbidden dependencies
- Upgrade policy

**When to Read:** Before adding any dependency  
**When to Update:** When adding/upgrading dependencies, changing build tools

---

#### 4. FRONTEND_GUIDELINES.md (Frontend Guidelines)
**Purpose:** Complete design system and UI patterns  
**Contains:**
- Color palette (exact hex codes)
- Typography (fonts, sizes, weights)
- Spacing scale
- Component patterns (buttons, forms, tables)
- Layout patterns (page, card, drawer, modal)
- Tailwind usage rules
- Code style and conventions
- Accessibility guidelines

**When to Read:** Before writing any UI component  
**When to Update:** When adding UI patterns, changing design system

---

#### 5. BACKEND_STRUCTURE.md (Backend Structure)
**Purpose:** Database schema and API contracts  
**Contains:**
- Complete database schema (all tables, fields, indexes)
- API contracts (inputs, outputs, side effects)
- Genome hashing algorithm
- Authentication patterns
- Error handling
- Performance optimization rules
- Data validation rules

**When to Read:** Before writing any backend code  
**When to Update:** When adding tables, changing schema, adding APIs

---

#### 6. IMPLEMENTATION_PLAN.md (Implementation Plan)
**Purpose:** Step-by-step build sequence  
**Contains:**
- Phase breakdown (P1.1, P1.2, P1.3, P2.0)
- Week-by-week schedule
- Step-by-step tasks with acceptance criteria
- Commit message patterns
- Testing strategy
- Deployment strategy
- Risk mitigation

**When to Read:** At the start of every work session  
**When to Update:** After completing phases, adjusting timeline

---

### 🔄 Session Files (2 files) - Persistence Layer

These documents preserve context across AI sessions.

#### 7. CLAUDE.md (AI Operating Manual)
**Purpose:** Rules and patterns AI must follow  
**Contains:**
- Critical rules (immutability, change records, etc.)
- Tech stack (locked versions)
- File organization conventions
- Convex patterns
- UI patterns
- State management rules
- Performance rules
- Common mistakes to avoid
- Session workflow

**When to Read:** **FIRST THING EVERY SESSION**  
**When to Update:** When patterns change, new rules added

---

#### 8. progress.txt (Progress Tracker)
**Purpose:** External memory bridge between sessions  
**Contains:**
- Current phase status
- What works (completed features)
- What's NOT implemented yet
- Known issues
- Recent changes (last session)
- Next session checklist
- Infrastructure status
- Notes and learnings

**When to Read:** **SECOND THING EVERY SESSION**  
**When to Update:** **AFTER EVERY CODING SESSION**

---

## How the System Works

### The Problem Without SDD
```
User: "Build a user authentication system"
AI: *Starts coding immediately*
     - Guesses requirements
     - Makes architectural decisions
     - Chooses random tech stack
     - No documentation
     - No source of truth
Result: Project falls apart after a few files
```

### The Solution With SDD
```
User: "Build a user authentication system"
AI: 
  1. Reads PRD.md → Understands scope
  2. Reads APP_FLOW.md → Understands user journey
  3. Reads TECH_STACK.md → Uses correct dependencies
  4. Reads FRONTEND_GUIDELINES.md → Follows design system
  5. Reads BACKEND_STRUCTURE.md → Uses correct schema
  6. Reads IMPLEMENTATION_PLAN.md → Follows build sequence
  7. Reads CLAUDE.md → Follows rules
  8. Reads progress.txt → Knows current state
  9. *Now codes with high certainty*
Result: Code implements documented specs, no hallucinations
```

---

## Document Cross-References

### PRD.md References:
- APP_FLOW.md (for user flows)
- TECH_STACK.md (for constraints)
- IMPLEMENTATION_PLAN.md (for phases)

### APP_FLOW.md References:
- PRD.md (for features)
- FRONTEND_GUIDELINES.md (for UI patterns)
- BACKEND_STRUCTURE.md (for data)

### TECH_STACK.md References:
- FRONTEND_GUIDELINES.md (for dependencies)
- BACKEND_STRUCTURE.md (for backend tech)

### FRONTEND_GUIDELINES.md References:
- TECH_STACK.md (for versions)
- APP_FLOW.md (for patterns)

### BACKEND_STRUCTURE.md References:
- PRD.md (for entities)
- TECH_STACK.md (for Convex version)

### IMPLEMENTATION_PLAN.md References:
- PRD.md (for scope)
- APP_FLOW.md (for features)
- BACKEND_STRUCTURE.md (for schema)

### CLAUDE.md References:
- All 6 canonical docs
- progress.txt

### progress.txt References:
- IMPLEMENTATION_PLAN.md (for next steps)
- CLAUDE.md (for rules)

---

## Session Workflow

### Starting a Session
1. **Read progress.txt** - What's the current state?
2. **Read CLAUDE.md** - What are the rules?
3. **Read relevant canonical docs** - What am I building?
4. **Check git status** - What changed?
5. **Start coding**

### During Session
1. **Reference docs** when unsure
2. **Follow patterns** in CLAUDE.md
3. **Write small commits**
4. **Test after each step**

### Ending Session
1. **Commit all work**
2. **Update progress.txt** - What did I do?
3. **Update IMPLEMENTATION_PLAN.md** - Timeline changes?
4. **Note blockers** - What's blocking me?

---

## Benefits of SDD

### For AI
- **High certainty** - No guessing requirements
- **Structural guardrails** - Can't make unauthorized decisions
- **Context persistence** - Remembers across sessions
- **Pattern consistency** - Follows established patterns

### For Developers
- **Clear roadmap** - Always know what to build next
- **No scope drift** - PRD defines boundaries
- **Easy onboarding** - Read docs, understand project
- **Maintainable** - Code matches documentation

### For Teams
- **Single source of truth** - Docs are authoritative
- **Async collaboration** - Docs enable distributed work
- **Quality gates** - Can't merge without docs
- **Knowledge transfer** - Docs outlive team members

---

## Maintenance Rules

### When to Update Docs

**PRD.md:**
- Feature added/removed
- Scope changed
- Success criteria changed

**APP_FLOW.md:**
- New view added
- User flow changed
- Navigation changed

**TECH_STACK.md:**
- Dependency added/upgraded
- Build tool changed
- Environment variable added

**FRONTEND_GUIDELINES.md:**
- Design system changed
- New component pattern
- Code style changed

**BACKEND_STRUCTURE.md:**
- Schema changed
- API contract changed
- Performance rule changed

**IMPLEMENTATION_PLAN.md:**
- Phase completed
- Timeline adjusted
- Step added/removed

**CLAUDE.md:**
- New rule added
- Pattern changed
- Common mistake discovered

**progress.txt:**
- **EVERY SESSION** (mandatory)

---

## Quality Checklist

### Before Committing Code
- [ ] Relevant docs updated
- [ ] Code matches documented patterns
- [ ] No new dependencies without TECH_STACK.md update
- [ ] No new UI without FRONTEND_GUIDELINES.md reference
- [ ] No new schema without BACKEND_STRUCTURE.md update
- [ ] progress.txt updated

### Before PR/Merge
- [ ] All acceptance criteria met (from IMPLEMENTATION_PLAN.md)
- [ ] All docs in sync with code
- [ ] No TODOs in code (create issues instead)
- [ ] Commit messages follow format (from IMPLEMENTATION_PLAN.md)

---

## Common Pitfalls

### ❌ Don't Do This
```
1. Start coding without reading docs
2. Update code without updating docs
3. Skip progress.txt updates
4. Ignore CLAUDE.md rules
5. Add dependencies without TECH_STACK.md approval
6. Create UI without FRONTEND_GUIDELINES.md reference
7. Change schema without BACKEND_STRUCTURE.md update
```

### ✅ Do This Instead
```
1. Read docs first, code second
2. Update docs with code changes
3. Update progress.txt every session
4. Follow CLAUDE.md rules strictly
5. Check TECH_STACK.md before adding dependencies
6. Reference FRONTEND_GUIDELINES.md for all UI
7. Update BACKEND_STRUCTURE.md with schema changes
```

---

## Success Metrics

### Documentation Quality
- ✅ All 8 files exist
- ✅ All files comprehensive (not stubs)
- ✅ Cross-references accurate
- ✅ Updated within 24 hours of code changes

### Code Quality
- ✅ Code matches documented patterns
- ✅ No hallucinated requirements
- ✅ No unauthorized architectural decisions
- ✅ Consistent style across codebase

### Team Velocity
- ✅ New team members productive in <1 day
- ✅ Context switches <5 minutes
- ✅ Merge conflicts rare
- ✅ Technical debt low

---

## File Sizes (Reference)

```
PRD.md:                    ~4,500 lines
APP_FLOW.md:               ~600 lines
TECH_STACK.md:             ~550 lines
FRONTEND_GUIDELINES.md:    ~800 lines
BACKEND_STRUCTURE.md:      ~900 lines
IMPLEMENTATION_PLAN.md:    ~700 lines
CLAUDE.md:                 ~500 lines
progress.txt:              ~200 lines

Total:                     ~8,750 lines of documentation
```

**This is intentional.** Comprehensive documentation prevents 10x more bugs than it costs to write.

---

## Evolution

### P1.1 (Current)
- All 8 docs complete
- Covers walking skeleton

### P1.2 (Next)
- Update PRD.md with policy details
- Update APP_FLOW.md with policy flows
- Update BACKEND_STRUCTURE.md with policy schema
- Update IMPLEMENTATION_PLAN.md with P1.2 steps

### P2.0 (Future)
- Update all docs with advanced features
- Add new docs if needed (e.g., DEPLOYMENT.md)

---

## Conclusion

The Documentation-First System (SDD) is ARM's competitive advantage. It enables:
- **AI to operate with high certainty** (no hallucinations)
- **Developers to move fast** (clear roadmap)
- **Teams to collaborate async** (single source of truth)
- **Code to stay maintainable** (docs never drift)

**Golden Rule:** If it's not documented, it doesn't exist.

---

**Document Owner:** Engineering Team  
**Last Review:** February 10, 2026  
**Next Review:** After P1.2 completion
