# trustops-platform

TrustOps Platform is a portfolio-grade multi-tenant trust and safety operations platform. Phase 1 establishes the API foundation only: NestJS, PostgreSQL, Prisma, Redis via Docker Compose, authentication, users, organizations, memberships, seed data, tests, and CI.

Moderation and reporting workflows are intentionally not implemented yet.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

The seed creates demo users with the password `Password123!`:

- `owner@trustops.dev`
- `admin@trustops.dev`
- `mod@trustops.dev`
- `viewer@trustops.dev`

## Development

```bash
npm run dev -w apps/api
```

The API listens on `http://localhost:3000` by default.

## Validation

```bash
npm run lint
npm run test
npm run build
```

API workspace commands:

```bash
npm run test -w apps/api
npm run build -w apps/api
```

## Phase 1 Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/:id`
- `POST /organizations`
- `GET /organizations`
- `GET /organizations/:id`
- `POST /memberships`
- `GET /memberships/organizations/:organizationId`
- `GET /memberships/users/:userId`
