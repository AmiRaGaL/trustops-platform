# AGENTS.md

## Project

TrustOps Platform is a portfolio-grade multi-tenant trust and safety operations platform.

The project demonstrates backend and full-stack engineering patterns:
- NestJS modular architecture
- PostgreSQL relational modeling
- Prisma migrations
- Redis/BullMQ async workflows
- RBAC authorization
- Auditability
- Cursor pagination
- API documentation
- CI-backed tests

## Current phase

We are in Phase 1: foundation.

Do not implement moderation/reporting workflows yet unless explicitly asked.

Phase 1 includes:
- Repository setup
- NestJS API scaffold
- PostgreSQL + Prisma
- Redis dependency through Docker Compose
- Auth module
- Users module
- Organizations module
- Memberships and roles
- Health check endpoint
- Seed data
- Basic tests
- GitHub Actions CI

## Coding standards

- Use TypeScript.
- Prefer clear modular NestJS architecture.
- Keep controllers thin.
- Put business logic in services.
- Use DTOs with class-validator.
- Use Prisma for database access.
- Use explicit error handling.
- Avoid `any` unless unavoidable.
- Add tests for important services and endpoints.
- Keep code readable for recruiters.

## Security expectations

- Never commit secrets.
- Use `.env.example`.
- Hash passwords with bcrypt or argon2.
- Validate all incoming request bodies.
- Use role checks for protected admin routes.
- Keep authentication logic separate from authorization logic.

## Commands

Use these commands when validating changes:

```bash
npm install
npm run lint
npm run test
npm run build
```

For API workspace

```bash
npm run dev -w apps/api
npm run test -w apps/api
npm run build -w apps/api
```

## Documentation expectations

When adding a module, update the README or relevant docs if setup, commands, endpoints, or architecture change.