# Finlytic — AI-Powered Personal Finance Tracker

> Track your spending with minimal effort using AI categorization, insights, and cash flow forecasting.

## Features

- **AI Categorization** — type a transaction description and get an instant category suggestion powered by Gemini
- **CSV Import** — upload a bank statement and let AI categorize every row in one batch call
- **AI Insights** — get spending analysis (overspending alerts, trends, anomalies, saving opportunities) refreshed hourly
- **Transaction CRUD** — create, edit, filter, and delete transactions with date-range and type filters
- **JWT Auth** — register/login with short-lived access tokens + refresh token rotation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, TailwindCSS, Chart.js 4, RxJS 7 |
| Backend | .NET 8 Web API, Entity Framework Core 8, FluentValidation, Serilog, Polly |
| Database | PostgreSQL |
| AI | Google Gemini 1.5 Flash |
| Infrastructure | Docker, GitHub Actions, Railway/Render *(Phase 5)* |

## Architecture

```
finlytic/
├── apps/
│   ├── api/                      # .NET 8 Web API — Layered Architecture
│   │   └── src/
│   │       ├── Finlytic.Api/         # Controllers, middleware, DI setup
│   │       ├── Finlytic.Application/ # Interfaces, DTOs, FluentValidation
│   │       ├── Finlytic.Domain/      # Entities, enums (no framework deps)
│   │       └── Finlytic.Infrastructure/ # EF Core, Gemini AI, CSV parser
│   └── web/                      # Angular 19 — standalone components + Signals
│       └── src/app/
│           ├── core/             # Auth service, HTTP interceptor, guard
│           ├── features/         # transactions/, dashboard/, import/
│           └── layout/           # App shell with sidebar navigation
└── docs/
    ├── decisions/                # ADR-001 (Tech Stack), ADR-002 (EF Core), ADR-003 (AI)
    └── Guideline-Dev.md          # Full development roadmap
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech) / [Supabase](https://supabase.com) free tier)
- Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### Backend

```bash
cd apps/api/src/Finlytic.Api

# Add secrets (never commit these)
dotnet user-secrets set "ConnectionStrings:Default" "Host=...;Database=finlytic;Username=...;Password=..."
dotnet user-secrets set "Gemini:ApiKey" "your-gemini-api-key"
dotnet user-secrets set "Jwt:Secret" "your-32-char-secret"

dotnet ef database update --project ../Finlytic.Infrastructure
dotnet run
# API available at https://localhost:5001
# Swagger UI at https://localhost:5001/swagger
```

### Frontend

```bash
cd apps/web
npm install
ng serve
# App available at http://localhost:4200
```

### Quick login (development only)

```http
POST http://localhost:5001/auth/dev-login
{ "email": "dev@local.com" }
```

Returns a JWT without a password — only works when `ASPNETCORE_ENVIRONMENT=Development`.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login → JWT + refresh token |
| POST | `/auth/refresh` | Rotate refresh token |
| GET | `/transactions` | List with `startDate`, `endDate`, `type` filters |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/{id}` | Update transaction |
| DELETE | `/transactions/{id}` | Delete transaction |
| POST | `/transactions/suggest` | AI category suggestion |
| POST | `/import/csv` | Upload CSV → background AI categorization |
| GET | `/import/jobs/{jobId}` | Poll import job progress |
| GET | `/insights` | AI spending insights (1hr cache) |
| GET | `/health` | Health check |

## Documentation

- [Architecture Decisions](docs/decisions/) — ADR-001, ADR-002, ADR-003
- [Development Roadmap](docs/Guideline-Dev.md)

## Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Design & Setup | ✅ Done |
| 1 | Foundation (Auth, DB, Angular shell) | ✅ Done |
| 2 | Transaction CRUD + EF Core deep dive | ✅ Done |
| 3 | AI Integration (Gemini, CSV import, Insights) | ✅ Done |
| 4 | Dashboard & Visualization | 🔄 In progress |
| 5 | Polish & Deploy | ⬜ Planned |
