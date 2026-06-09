# 0001: Why NestJS, Prisma, And PostgreSQL

## Context

TrustOps needs to demonstrate backend architecture, relational modeling, validation, authentication, and testable service boundaries. The project should be readable for recruiters while still looking like a realistic internal operations platform.

## Decision

Use NestJS for the API, Prisma for database access and migrations, and PostgreSQL as the relational database.

## Alternatives Considered

- Express or Fastify without a framework-level module system.
- TypeORM instead of Prisma.
- MongoDB or another document database.
- A backend-as-a-service instead of a dedicated API.

## Tradeoffs

NestJS adds framework structure, but that structure helps show controllers, services, guards, modules, and dependency injection clearly. Prisma keeps schema and query code approachable, but complex reporting queries may eventually need raw SQL. PostgreSQL is heavier than an embedded database, but it is the right fit for tenant boundaries, joins, constraints, and audit-oriented data.
