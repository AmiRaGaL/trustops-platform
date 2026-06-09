# Demo Script

This is a 3 to 5 minute walkthrough for a recruiter or interviewer.

## Before The Demo

Start the local stack:

```bash
docker compose up -d
npm run dev -w apps/api
npm run dev -w apps/web
```

Open the dashboard and use:

```text
Email: mod@trustops.dev
Password: Password123!
```

## Walkthrough

### 1. Login As Moderator

"TrustOps is a portfolio-grade moderation operations platform. I am logging in as a seeded moderator, which gives me access to reports only through organization-scoped membership."

Show `/login`, authenticate, and land in the dashboard.

### 2. View The Queue

"The dashboard summarizes recent moderation work: open reports, reports in review, escalations, and critical items. The queue is backed by cursor pagination and filters for status, reason, severity, and assignee."

Open `/reports` and show the report table.

### 3. Open A Report

"A report detail page combines the user report, the reported content, the reporter, assignee, lifecycle events, internal notes, and moderation actions. This is the core case review workspace."

Open one report from the queue.

### 4. Assign The Report

"Assigning a report checks that the actor can moderate this organization and that the target moderator also has access. If the report was open, it moves to in review and writes both a report event and an audit log."

Use the assignment control on the report detail page.

### 5. Add An Internal Note

"Internal notes are moderator-only context. They do not change the content state, but they do create an audit log entry so reviewer activity remains accountable."

Add a short note:

```text
Reviewed content and matched it against the spam policy.
```

### 6. Take A Moderation Action

"Actions are the decision record. For example, hiding content marks the content as hidden, resolves the report, creates a report event, and writes an audit log record."

Take a demo action such as `HIDE_CONTENT` with:

```text
Confirmed spam content in seeded demo data.
```

### 7. View Audit Logs

"The audit log view is tenant-scoped. It lets moderators and admins see who assigned, noted, or actioned an entity. This is separate from the report event timeline: events explain lifecycle, audit logs explain accountability."

Open `/audit-logs` and point out actor, action, entity, metadata, and timestamp.

### 8. Explain Architecture And Security Choices

"The backend is a modular NestJS API. Controllers are thin, DTOs validate input, services own business rules, and Prisma maps the relational model. Multi-tenancy is organization-scoped through memberships rather than global roles. The dashboard is a Next.js app using a typed API client. This project deliberately skips ML classifiers, webhooks, OpenTelemetry, and production deployment so the review workflow stays focused and easy to inspect."

## Good Interview Prompts

- "Why separate report events from audit logs?"
- "How does organization-scoped RBAC prevent cross-tenant access?"
- "Which indexes support the moderator queue?"
- "What would you add before production deployment?"
- "Where would async jobs or notifications fit later?"
