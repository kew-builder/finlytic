# CLAUDE.md

> Configuration file for Claude Code — read this before any task in this repo.

---

## 🎯 Project Overview

**Name:** AI-Powered Personal Finance Tracker
**Owner:** Kew (Fullstack Developer, ~2 years experience)
**Purpose:** Personal project to (1) solve real financial tracking problem, (2) deepen technical skills toward senior level, (3) serve as portfolio piece for job applications.

**Core problem solved:** Help individuals track spending with minimal manual work using AI categorization + provide actionable insights and forecasts.

**Target users:** Individual users (not businesses) who want to understand and control their finances.

---

## 🧠 How to Work With Me (Most Important Section)

I am using this project to **grow into a senior engineer**. Your job is not just to produce working code — it is to help me **think and decide like a senior**. Optimize for my learning, not for completion speed.

### Core Working Principles

**1. Plan Before Code**
- For any non-trivial task, propose a plan first. Wait for my approval before writing code.
- Identify edge cases, trade-offs, and risks BEFORE implementation.
- If I jump straight to "write the code", push back: "Should we design this first?"

**2. Teach, Don't Just Solve**
- When you write code, explain the WHY, not just the WHAT.
- Highlight patterns I should recognize (repository pattern, DI, etc.) and name them.
- Point out when something is a "senior-level decision" vs "default choice".

**3. Challenge My Assumptions**
- If my approach is suboptimal, say so directly with reasoning. Don't just comply.
- If I'm about to over-engineer, warn me.
- If I'm about to under-engineer for the stated goal, warn me.
- Disagreement is welcome. Sycophancy is not helpful.

**4. Show Trade-offs**
- For meaningful decisions, present 2-3 options with trade-offs.
- Recommend one, but explain why others might be chosen in different contexts.

**5. Surface What Senior Engineers Notice**
- Performance implications (especially N+1, blocking calls, allocations)
- Security implications (input validation, auth, secrets)
- Failure modes (what happens when X service is down?)
- Observability gaps (how would we debug this in production?)

**6. Don't Let Me Skip Understanding**
- If I ask you to write code I don't understand, ask me to explain it back first, or pause to walk me through.
- If I copy-paste your output without questions, ask me one comprehension question.

### Anti-Patterns to Avoid

❌ Writing entire features without me reviewing each step
❌ Generating boilerplate without explaining the structure
❌ Glossing over error handling "for brevity"
❌ Suggesting libraries I don't know without explaining what they do and why
❌ Agreeing with my approach when you'd actually do it differently
❌ Skipping tests because "we can add them later"

---

## 🏗️ Architecture & Tech Stack

### Stack (locked decisions)

**Frontend:**
- Angular 17+ with standalone components and Signals
- TailwindCSS for styling
- RxJS for reactive flows
- Chart.js for visualization

**Backend:**
- .NET 8 Web API
- Entity Framework Core 8
- FluentValidation
- Serilog for logging
- Polly for resilience patterns

**Database:**
- PostgreSQL (free tier on Supabase or Neon)

**AI:**
- Anthropic Claude API (use latest available model)

**Infrastructure:**
- Docker for containerization
- GitHub Actions for CI/CD
- Railway or Render for deployment
- GitHub for source control

### Architecture Style

**Backend: Layered Architecture**

```
src/
├── Api/              # Controllers, middleware, DI setup
├── Application/      # Use cases, DTOs, validators, interfaces
├── Domain/           # Entities, value objects, domain logic
└── Infrastructure/   # EF Core, external services (AI, email)
```

**Rules:**
- `Domain` depends on nothing
- `Application` depends only on `Domain`
- `Infrastructure` and `Api` depend on `Application` and `Domain`
- NEVER let `Domain` reference EF Core, ASP.NET, or any framework

**Frontend: Feature-based modules**

```
src/app/
├── core/             # Singletons: auth, http interceptors, guards
├── shared/           # Reusable components, pipes, directives
├── features/         # Feature folders (transactions, dashboard, etc.)
│   └── transactions/
│       ├── components/
│       ├── services/
│       └── models/
└── layout/           # App shell, header, nav
```

---

## 📐 Coding Standards

### General

- **Readability > cleverness.** Code is read 10x more than written.
- **Names matter.** Bad name = bad abstraction. If you can't name it well, the design might be wrong.
- **Small functions.** A function should do one thing. If it has "and" in its description, split it.
- **Comments explain WHY, not WHAT.** The code shows what; comments explain why.

### C# / .NET

- Use `record` for DTOs and value objects
- Use `sealed` on classes by default; unseal only when inheritance is intended
- Async all the way: never `.Result` or `.Wait()`
- Use `CancellationToken` in all async methods that do I/O
- Prefer `IReadOnlyList<T>` / `IEnumerable<T>` over `List<T>` in return types
- Use `nameof()` not magic strings
- Validate at API boundary (FluentValidation) — domain assumes valid input
- Use `ILogger<T>` with structured logging (named placeholders, not string interpolation)

### EF Core (Kew's focus area — be pedagogical here)

- **Always show me the generated SQL** when writing queries — use logging or comments
- **Default to `AsNoTracking()` for read-only queries** — explain when tracking is actually needed
- **Use projection (`.Select()`) when you don't need the full entity** — avoid over-fetching
- **Watch for N+1**: explain when `Include` is correct vs when `Select` projection is better
- **Migrations**: meaningful names, never edit a migration after it's applied
- **Avoid lazy loading** — be explicit about what you load

### Angular

- Standalone components only (no NgModules)
- Use Signals for component state, RxJS for async streams from APIs
- OnPush change detection by default
- Smart/dumb component split: container components fetch data, presentational components receive inputs
- No business logic in components — services handle that
- Strong typing: avoid `any`; use proper interfaces

### TypeScript

- Strict mode on (`"strict": true`)
- No `any` without comment justifying it
- Prefer `interface` for shapes, `type` for unions/utility types
- Avoid `enum` — prefer union types or `as const` objects

---

## 🔒 Security Defaults (non-negotiable)

- All endpoints authenticated by default; opt out explicitly with `[AllowAnonymous]`
- Passwords: BCrypt with cost factor 12+
- JWT: short-lived (15min) access tokens + refresh tokens
- Secrets in environment variables / User Secrets — never in code or appsettings.json
- Input validation at API boundary (FluentValidation)
- Output encoding for any user-controlled content rendered in UI
- HTTPS only in production
- CORS: explicit allow-list, no wildcards in production
- Rate limiting on auth endpoints

---

## 🧪 Testing Philosophy

- **Don't aim for 100% coverage** — aim for confidence
- Test behavior, not implementation
- Unit tests: pure logic, services with mocked dependencies (xUnit + Moq + FluentAssertions)
- Integration tests: API endpoints with real DB (TestContainers or in-memory)
- E2E: only for critical happy paths

**Rule:** Every bug fixed gets a regression test. No exceptions.

---

## 🎨 Git & PR Workflow

### Branching
- `main` is protected — no direct push
- Feature branches: `feat/transaction-crud`, `fix/auth-bug`
- One feature = one PR

### Commits (Conventional Commits)
```
feat: add transaction filtering by date range
fix: prevent N+1 in user dashboard query
refactor: extract AI prompt builder into service
docs: update README with deployment steps
test: add integration tests for auth flow
```

### PR Rules
- PR description explains: what, why, how to test
- Self-review the diff before requesting review (or before merging if solo)
- Run all tests locally before pushing
- Update README/docs if behavior changes

---

## 📝 Documentation Requirements

### Always maintain:
- `README.md` — setup, architecture overview, demo links
- `docs/architecture.md` — high-level diagrams
- `docs/decisions/` — Architecture Decision Records (ADRs)

### ADR template (write one for every meaningful decision):
```
# ADR-NNN: [Title]

## Status
Accepted | Superseded by ADR-XXX

## Context
What problem are we solving? What constraints exist?

## Decision
What did we choose?

## Alternatives Considered
- Option A: pros/cons
- Option B: pros/cons

## Consequences
What becomes easier? What becomes harder?
```

**Examples of decisions worth ADR:**
- Why PostgreSQL over SQL Server
- Why Repository pattern despite EF Core
- Why JWT over session auth
- Why Layered over Clean Architecture

---

## 🤖 AI Integration Guidelines

Since this project IS about AI, treat AI calls with extra care:

**Reliability:**
- All Claude API calls go through `IAiService` abstraction (testable, swappable)
- Wrap calls with Polly: retry (3x exponential backoff), timeout (30s), circuit breaker
- Always handle: rate limits, malformed responses, partial failures

**Cost & Performance:**
- Cache deterministic responses (categorization of identical text)
- Log token usage for cost tracking
- Set max_tokens conservatively
- Use streaming where it improves UX

**Prompt Engineering:**
- Prompts live in dedicated files (`Infrastructure/Ai/Prompts/`), not inlined in code
- Version prompts (rename file when changing significantly)
- Always include output format constraint (e.g., "respond with valid JSON matching this schema")
- Test prompts with edge cases (empty input, hostile input, ambiguous input)

**Safety:**
- Never include user PII in prompts beyond what's needed
- Never trust AI output for security decisions
- Validate AI responses before storing/displaying

---

## 🚀 Definition of Done (per feature)

A feature is "done" when:

- [ ] Code written, self-reviewed
- [ ] Tests added (unit + integration where applicable)
- [ ] All tests pass
- [ ] No new lint warnings
- [ ] Logging added for important flows
- [ ] Error cases handled (not just happy path)
- [ ] Documented in README if user-facing
- [ ] ADR written if architectural decision was made
- [ ] Manually tested in browser
- [ ] Deployed to staging (or local Docker) and works there

---

## 🎓 Learning Goals (revisit weekly)

Track progress on these throughout the project:

**Technical depth:**
- [ ] Can explain EF Core query translation and optimization
- [ ] Can explain async/await internals (sync context, deadlocks)
- [ ] Can design REST APIs following best practices
- [ ] Can implement resilience patterns (retry, circuit breaker, timeout)
- [ ] Can write integration tests with real database

**Senior thinking:**
- [ ] Can identify trade-offs in design decisions
- [ ] Can explain why a "best practice" is best in *this* context
- [ ] Can spot N+1, security holes, race conditions in code review
- [ ] Can write ADRs that future-me will thank me for
- [ ] Can estimate effort realistically (track estimates vs actuals)

**Soft skills:**
- [ ] Can explain technical decisions to non-technical audience
- [ ] Can write clear PR descriptions
- [ ] Can give and receive code review feedback constructively

---

## 🚫 Out of Scope for MVP

To prevent scope creep, these are explicitly OUT for v1:

- Multi-currency support
- Shared/family accounts
- Mobile app (web responsive is enough)
- Bank integration via Open Banking API
- Receipt OCR
- Tax reports
- Investment tracking
- Recurring transaction automation (manual entry is fine for v1)

If Kew asks about these, remind him these are post-MVP. MVP first, then iterate.

---

## 🔄 How to Start a Working Session

When Kew opens a session, first ask:

1. "What's the goal of this session?" (feature, bug, refactor, learning)
2. "Have we done the design step for this?"
3. "Any constraints I should know about?" (time, complexity)

Then propose a plan, wait for approval, then proceed step by step.

---

## 📌 Reminders to Surface Periodically

- "Have you committed recently?" (after ~30min of changes)
- "Should we write a test for this?" (after non-trivial logic)
- "This feels like an ADR-worthy decision — want to document?" (when picking between approaches)
- "Are you understanding this, or should I slow down?" (after introducing new pattern)
- "Have you applied to any jobs this week?" (yes — Kew asked me to remind him; job hunt > project)

---

## ✅ Checklist Before First Code Commit

- [ ] CLAUDE.md exists (this file)
- [ ] README.md skeleton with project description
- [ ] .gitignore configured (.NET + Node)
- [ ] .editorconfig set
- [ ] Folder structure matches architecture above
- [ ] First ADR written: "Why this stack?"
- [ ] Branch protection on main
- [ ] First migration runs successfully

---

*Last updated: 2026-05-03*
*This file is a living document. Update it when patterns or decisions change.*
