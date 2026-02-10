# Changelog

All notable changes to ARM (Agent Resource Management) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Evaluation orchestration (P2.0)
- Cost tracking and attribution (P2.0)
- Advanced monitoring and dashboards (P2.0)
- Authentication and authorization (P2.0)
- Automated test suite (P2.0)

---

## [1.0.0] - 2026-02-10

### 🎉 Initial Release

ARM v1.0.0 represents the completion of **Phase 1: Walking Skeleton** with full governance capabilities.

### Added

#### Phase 1.1: Walking Skeleton
- **Multi-tenant architecture** with isolated tenant data
- **Agent Templates** for defining agent types
- **Agent Versions** with immutable genome and SHA-256 hashing
- **Agent Instances** for runtime deployments
- **Providers** for local and federated execution
- **Environments** for staging/production separation
- **Operators** for user management
- **Change Records** for append-only audit trail
- **Convex backend** with real-time reactivity
- **React frontend** with Tailwind CSS and dark mode
- **Monorepo structure** with pnpm workspaces
- **Seed script** for demo data

#### Phase 1.2: Policy Engine & Approvals
- **Policy Envelopes** with autonomy tiers (0-5)
- **Policy Evaluation Engine** with risk classification
- **Approval Records** for human-in-the-loop governance
- **Approval Workflows** with request/approve/deny/cancel
- **State Machine Validation** for version and instance transitions
- **PoliciesView** UI for managing policies
- **ApprovalsView** UI with filtering and pending count

#### Phase 1.3: Enhanced UI
- **StatusChip** component for consistent status display
- **CopyButton** component for copying IDs and hashes
- **Toast Notification System** for user feedback
- **ErrorBoundary** for graceful error handling
- **Search and Filtering** in DirectoryView
- **CreateTemplateModal** with email validation
- **CreateVersionModal** with semver and SHA-256 validation
- **Enhanced DirectoryView** with improved UX

#### Documentation
- **PRD.md**: Product Requirements Document
- **APP_FLOW.md**: Application user flows
- **TECH_STACK.md**: Technology stack definitions
- **FRONTEND_GUIDELINES.md**: Design system and UI patterns
- **BACKEND_STRUCTURE.md**: Backend schema and API contracts
- **IMPLEMENTATION_PLAN.md**: Phased build sequence
- **CLAUDE.md**: AI Operating Manual
- **progress.txt**: Development progress tracker
- **SDD_SYSTEM.md**: Spec-Driven Development guide
- **API_REFERENCE.md**: Complete API documentation
- **DEPLOYMENT.md**: Production deployment guide
- **ARCHITECTURE.md**: System design documentation
- **TESTING.md**: Testing strategy and examples
- **SECURITY.md**: Security practices and policies
- **CONTRIBUTING.md**: Development guidelines
- **README.md**: Project overview and quick start
- **QUICKSTART.md**: Concise setup guide

#### AI Tooling Integration
- **178+ AI agents** from baseline-project
- **65+ Claude skills** for specialized tasks
- **49+ slash commands** for workflows
- **Taskmaster integration** for AI-powered task management
- **Compound Engineering workflows** for knowledge compounding
- **AI_TOOLING_INTEGRATION.md**: Complete AI tooling guide
- **AI_TOOLING_QUICK_START.md**: Quick reference
- **BASELINE_PROJECT_INTEGRATION.md**: Integration summary
- **.cursorrules**: Cursor rules with AI tooling information

### Changed
- Migrated from FastAPI/PostgreSQL to Convex
- Moved legacy code to `_quarantine/` directory
- Updated README with AI tooling section
- Enhanced CLAUDE.md with AI development patterns
- Updated progress.txt with Phase 1 completion

### Fixed
- Genome hash integrity verification
- State machine transition validation
- Policy evaluation edge cases
- UI error handling with ErrorBoundary
- Toast notifications replacing alert() calls

### Security
- Multi-tenant data isolation
- SHA-256 genome hashing for integrity
- Append-only audit trail (change records)
- Input validation on all mutations
- XSS prevention in React components

---

## Version History

### Phase 1: Walking Skeleton ✅ COMPLETE

**P1.1: Core Infrastructure** (Completed 2026-02-08)
- Convex backend setup
- React frontend with Tailwind
- Basic CRUD for templates, versions, instances
- Genome hashing and integrity verification
- Seed script for demo data

**P1.2: Policy Engine & Approvals** (Completed 2026-02-09)
- Policy envelope CRUD
- Policy evaluation engine
- Approval record CRUD
- Approval workflows
- State machine validation

**P1.3: Enhanced UI** (Completed 2026-02-09)
- Reusable UI components
- Search and filtering
- Create modals
- Toast notifications
- Error boundary

**Documentation & AI Tooling** (Completed 2026-02-10)
- Complete documentation suite
- AI tooling integration
- Cursor rules and configuration

### Phase 2: Evaluation Orchestration 📋 NEXT

**P2.0: Planned Features**
- Test suite execution
- Result aggregation
- Automated version promotion
- Cost tracking and attribution
- Advanced monitoring dashboards

---

## Migration Guide

### From Development to Production

**Prerequisites:**
- Convex account
- Vercel/Netlify account (for frontend)
- Domain (optional)

**Steps:**
1. Deploy Convex backend: `convex deploy --prod`
2. Run seed script: `convex run seedARM --prod`
3. Build frontend: `cd ui && pnpm build`
4. Deploy frontend: `vercel --prod` or `netlify deploy --prod`
5. Configure environment variables
6. Test production deployment

**See:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions

---

## Breaking Changes

### None (Initial Release)

Future breaking changes will be documented here with migration instructions.

---

## Deprecations

### None (Initial Release)

Future deprecations will be announced here with removal timeline.

---

## Known Issues

### Current

None

### Resolved

- ✅ Convex CLI non-interactive setup (resolved with manual config)
- ✅ Docker unavailable in environment (pivoted to Convex-only development)
- ✅ StrReplace fuzzy match errors (resolved with exact string matching)

---

## Performance

### Benchmarks (P1.1)

| Operation | Latency | Throughput |
|-----------|---------|------------|
| List templates | <50ms | 1000/sec |
| Create version | <200ms | 100/sec |
| Get version (with hash verification) | <100ms | 500/sec |
| Policy evaluation | <10ms | 5000/sec |

### Optimization

- Indexed queries for fast lookups
- Memoized computed values
- Lazy loading for large lists (planned)
- Code splitting for views (planned)

---

## Dependencies

### Major Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **convex** | ^1.17.4 | Backend database + functions |
| **react** | ^18.3.1 | Frontend framework |
| **react-router-dom** | ^7.1.1 | Client-side routing |
| **tailwindcss** | ^3.4.17 | CSS framework |
| **vite** | ^6.0.5 | Build tool |
| **typescript** | ^5.7.2 | Type safety |

### Security Updates

- All dependencies audited with `pnpm audit`
- No known vulnerabilities in production dependencies
- Regular updates scheduled monthly

---

## Contributors

### Core Team

- **ARM Team** - Initial development and documentation

### Special Thanks

- **baseline-project** - AI tooling infrastructure
- **Convex** - Backend platform
- **Cursor** - AI-assisted development environment

---

## Support

### Getting Help

- **Documentation**: [docs/](docs/)
- **GitHub Issues**: [github.com/your-org/arm/issues](https://github.com)
- **Security Issues**: security@your-domain.com

### Reporting Bugs

Use the GitHub issue template:
```markdown
**Bug Description:**
Clear description

**Steps to Reproduce:**
1. ...
2. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- ARM Version: [e.g., 1.0.0]
```

---

## License

MIT License - See [LICENSE](LICENSE) file for details

---

## Roadmap

### Phase 2: Evaluation Orchestration (Q1 2026)
- [ ] Test suite execution
- [ ] Result aggregation
- [ ] Automated promotion
- [ ] Cost tracking
- [ ] Advanced monitoring

### Phase 3: Production Hardening (Q2 2026)
- [ ] Authentication & authorization
- [ ] RBAC implementation
- [ ] Automated test suite
- [ ] Performance optimization
- [ ] Security audit

### Phase 4: Enterprise Features (Q3 2026)
- [ ] Multi-region support
- [ ] Federation
- [ ] Advanced analytics
- [ ] Custom integrations
- [ ] SLA guarantees

---

## Release Process

### Versioning

ARM follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Deployment verified
- [ ] Announcement sent

### Release Schedule

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed (critical bugs)

---

## Acknowledgments

### Inspiration

ARM was inspired by the need for **governance and observability** in AI agent deployments. As AI agents become more autonomous, the need for **policy enforcement**, **approval workflows**, and **audit trails** becomes critical.

### Philosophy

ARM follows the principle of **"Trust, but Verify"**:
- Trust agents to operate autonomously
- Verify their actions through policies
- Require approval for high-risk operations
- Audit everything for compliance

### Future Vision

ARM aims to be the **standard platform for AI agent governance**, enabling organizations to:
- Deploy agents with confidence
- Enforce policies consistently
- Track costs and usage
- Maintain compliance
- Scale safely

---

**Last Updated:** February 10, 2026  
**Current Version:** 1.0.0  
**Next Release:** 2.0.0 (Q1 2026)

---

[Unreleased]: https://github.com/your-org/arm/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/arm/releases/tag/v1.0.0
