# trustops-platform

TrustOps Platform is a portfolio-grade multi-tenant trust and safety operations platform. The API foundation includes NestJS, PostgreSQL, Prisma, Redis via Docker Compose, authentication, users, organizations, memberships, seed data, tests, and CI.

Phase 2 adds the core moderation workflow: content items, user reports, moderator queues, assignments, status transitions, internal notes, moderation actions, and audit logs.

Phase 3 adds a Next.js admin dashboard for moderators, admins, and owners to review reports and audit activity.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

The seed creates demo users with the password `Password123!`, plus sample content and reports for moderation testing.

### Web Environment

`apps/web` reads the API URL from:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Development

```bash
npm run dev -w apps/api
npm run dev -w apps/web
```

The API listens on `http://localhost:3000` by default.
The web dashboard listens on `http://localhost:3001` if port `3000` is already in use by the API.

To run both workspaces together:

```bash
npm run dev
```

## Validation

```bash
npm run lint
npm run test
npm run build
```

API workspace commands:

```bash
npm run lint -w apps/api
npm run test -w apps/api
npm run build -w apps/api
```

Web workspace commands:

```bash
npm run lint -w apps/web
npm run test -w apps/web
npm run build -w apps/web
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

## Phase 2 Endpoints

TrustOps now supports a complete moderation workflow:

1. Users can report content.
2. Moderators can view reports in a queue.
3. Moderators can assign reports.
4. Moderators can add internal notes.
5. Moderators can take moderation actions.
6. Report status changes are recorded as events.
7. Moderator/admin actions are stored in audit logs.

### Demo Users

| Role | Email | Password |
|---|---|---|
| Owner | `owner@trustops.dev` | `Password123!` |
| Admin | `admin@trustops.dev` | `Password123!` |
| Moderator | `mod@trustops.dev` | `Password123!` |
| Viewer | `viewer@trustops.dev` | `Password123!` |
| User | `user1@trustops.dev` | `Password123!` |
| User | `user2@trustops.dev` | `Password123!` |

User-facing:

- `GET /content`
- `GET /content/:id`
- `POST /reports`
- `GET /reports/my`

Moderator/admin:

- `GET /admin/reports`
- `GET /admin/reports/:id`
- `POST /admin/reports/:id/assign`
- `POST /admin/reports/:id/notes`
- `POST /admin/reports/:id/actions`
- `POST /admin/reports/:id/escalate`
- `GET /admin/audit-logs`

The admin report queue supports cursor pagination with `cursor`, plus `status`, `reason`, `severity`, and `assignedModeratorId` filters. Admin endpoints require an authenticated user with `OWNER`, `ADMIN`, or `MODERATOR` membership in the report organization.

## Phase 3 Dashboard

The admin dashboard is a Next.js app under `apps/web`.

Routes:

- `/login` - local/demo login using `POST /auth/login`
- `/dashboard` - moderation overview and recent report metrics
- `/reports` - moderator queue with filters and cursor pagination
- `/reports/[id]` - report detail, assignment, internal notes, moderation actions, escalation, events, and action history
- `/audit-logs` - audit log viewer

Demo login credentials:

| Role | Email | Password |
|---|---|---|
| Moderator | `mod@trustops.dev` | `Password123!` |
| Admin | `admin@trustops.dev` | `Password123!` |
| Owner | `owner@trustops.dev` | `Password123!` |

These credentials are for local seed data only.

### Phase 3 Screenshots

Add screenshots here after running the dashboard locally:

- Login page
- Dashboard overview
- Report queue
- Report detail
- Audit logs

### Example cURL Commands

Authenticate as a demo user:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@trustops.dev",
    "password": "Password123!"
  }'
```

Authenticate as a moderator:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mod@trustops.dev",
    "password": "Password123!"
  }'
```

Create a report:

```bash
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer <user-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentItemId": "<content-item-id>",
    "reason": "SPAM",
    "severity": "MEDIUM",
    "description": "This looks like repeated promotional content."
  }'
```

View the moderator queue:

```bash
curl "http://localhost:3000/admin/reports?status=OPEN" \
  -H "Authorization: Bearer <moderator-access-token>"
```

Assign a report:

```bash
curl -X POST http://localhost:3000/admin/reports/<report-id>/assign \
  -H "Authorization: Bearer <moderator-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "moderatorUserId": "<moderator-user-id>"
  }'
```

Add an internal note:

```bash
curl -X POST http://localhost:3000/admin/reports/<report-id>/notes \
  -H "Authorization: Bearer <moderator-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Reviewing this report against the spam policy."
  }'
```

Take a moderation action:

```bash
curl -X POST http://localhost:3000/admin/reports/<report-id>/actions \
  -H "Authorization: Bearer <moderator-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "HIDE_CONTENT",
    "reason": "Confirmed spam content."
  }'
```

The returned report includes moderation actions using the same `reason` field:

```json
{
  "status": "RESOLVED",
  "moderationActions": [
    {
      "actionType": "HIDE_CONTENT",
      "reason": "Confirmed spam content."
    }
  ]
}
```

View audit logs:

```bash
curl "http://localhost:3000/admin/audit-logs" \
  -H "Authorization: Bearer <moderator-access-token>"
```
