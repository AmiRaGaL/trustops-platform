# API

Base local URL:

```text
http://localhost:3000
```

Authenticated endpoints use:

```http
Authorization: Bearer <access-token>
```

## Auth Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Create a user. |
| `POST` | `/auth/login` | No | Exchange email/password for an access token. |
| `GET` | `/auth/me` | Yes | Return the current authenticated user. |

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mod@trustops.dev",
    "password": "Password123!"
  }'
```

Get current user:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access-token>"
```

## Content Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/content` | No | List demo content items. |
| `GET` | `/content/:id` | No | Fetch one content item. |

List content:

```bash
curl http://localhost:3000/content
```

List content by type:

```bash
curl "http://localhost:3000/content?type=POST"
```

## Report Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/reports` | Yes | Create a report for a content item. |
| `GET` | `/reports/my` | Yes | List reports submitted by the current user. |

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

Valid report reasons:

```text
HARASSMENT, SPAM, HATE_SPEECH, IMPERSONATION, SELF_HARM, VIOLENCE, OTHER
```

Valid severities:

```text
LOW, MEDIUM, HIGH, CRITICAL
```

## Admin Report Endpoints

Admin report endpoints require the actor to have `OWNER`, `ADMIN`, or `MODERATOR` membership in the report organization.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/reports` | List visible reports with cursor pagination. |
| `GET` | `/admin/reports/:id` | Fetch report detail. |
| `POST` | `/admin/reports/:id/assign` | Assign a moderator to a report. |
| `POST` | `/admin/reports/:id/notes` | Add an internal note. |
| `POST` | `/admin/reports/:id/actions` | Take a moderation action. |
| `POST` | `/admin/reports/:id/escalate` | Escalate a report. |

Queue filters:

```text
status, reason, severity, assignedModeratorId, cursor
```

List the open queue:

```bash
curl "http://localhost:3000/admin/reports?status=OPEN" \
  -H "Authorization: Bearer <moderator-access-token>"
```

Fetch report detail:

```bash
curl http://localhost:3000/admin/reports/<report-id> \
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

Valid moderation actions:

```text
WARN_USER, HIDE_CONTENT, SUSPEND_USER, DISMISS_REPORT, ESCALATE_REPORT, NO_ACTION
```

Escalate a report:

```bash
curl -X POST http://localhost:3000/admin/reports/<report-id>/escalate \
  -H "Authorization: Bearer <moderator-access-token>"
```

## Audit Log Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/admin/audit-logs` | Moderator role required | List visible audit logs. |

Audit log filters:

```text
cursor, actorUserId, entityType
```

List audit logs:

```bash
curl http://localhost:3000/admin/audit-logs \
  -H "Authorization: Bearer <moderator-access-token>"
```

Filter by entity type:

```bash
curl "http://localhost:3000/admin/audit-logs?entityType=Report" \
  -H "Authorization: Bearer <moderator-access-token>"
```

## Common Error Cases

| Status | Typical cause |
| --- | --- |
| `400 Bad Request` | Request body or query does not satisfy DTO validation. |
| `401 Unauthorized` | Missing, invalid, or expired bearer token. |
| `403 Forbidden` | Authenticated user lacks moderator access to the organization. |
| `404 Not Found` | Requested user, organization, content item, or report does not exist. |
| `409 Conflict` | Duplicate report for the same content/reporter, or action attempted on a terminal report. |

## Demo Flow With Curl

1. Log in as `mod@trustops.dev`.
2. Copy the returned access token.
3. List reports with `/admin/reports`.
4. Copy a report ID.
5. Assign, note, or action the report.
6. Confirm audit records with `/admin/audit-logs`.
