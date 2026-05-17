# Finlytic — AI-Powered Personal Finance Tracker

> Track your spending with minimal effort using AI categorization, insights, and forecasting.

## Overview

Finlytic helps individuals understand and control their finances by:
- Automatically categorizing transactions using AI (Claude API)
- Importing bank statements via CSV
- Providing actionable spending insights and cash flow forecasts
- Visualizing spending patterns with interactive charts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17+, TailwindCSS, Chart.js |
| Backend | .NET 8 Web API, Entity Framework Core 8 |
| Database | PostgreSQL |
| AI | Anthropic Claude API |
| Infrastructure | Docker, GitHub Actions, Railway/Render |

## Architecture

```
finlytic/
├── apps/
│   ├── api/          # .NET 8 Web API (Layered Architecture)
│   │   ├── Api/          # Controllers, middleware, DI
│   │   ├── Application/  # Use cases, DTOs, interfaces
│   │   ├── Domain/       # Entities, domain logic
│   │   └── Infrastructure/ # EF Core, AI service, external APIs
│   └── web/          # Angular 17+ frontend
│       └── src/app/
│           ├── core/     # Auth, interceptors, guards
│           ├── shared/   # Reusable components
│           ├── features/ # Transaction, dashboard, AI features
│           └── layout/   # App shell
└── docs/             # Architecture decisions, diagrams, requirements
```

## Getting Started

> Setup guide coming in Phase 1.

## Documentation

- [Requirements](docs/requirements.md)
- [Architecture Decisions](docs/decisions/)

## Status

🚧 In development — Phase 1: Foundation
