# Screenshot Guide

This folder is reserved for recruiter-facing dashboard screenshots. If screenshots are not committed yet, use this guide as the capture checklist.

## Setup

Capture final portfolio screenshots from the live Vercel deployment:

```text
https://trustops-platform-web.vercel.app/
```

For local-only screenshot refreshes, start the API and web dashboard:

```bash
npm run dev -w apps/api
npm run dev -w apps/web
```

Log in with:

```text
Email: mod@trustops.dev
Password: Password123!
```

Recommended capture size: desktop browser at `1440x1000`. Keep seeded data visible and avoid showing local secrets or terminal output.

## Required Screenshots

| View | Route | Suggested file | Capture notes |
| --- | --- | --- | --- |
| Login page | `/login` | `login.png` | Show the simple demo login form before submitting credentials. |
| Dashboard overview | `/dashboard` | `dashboard.png` | Show moderation metrics and the recent reports table. |
| Report queue | `/reports` | `report-queue.png` | Show filters, statuses, severity pills, and the queue table. |
| Report detail | `/reports/:id` | `report-detail.png` | Show content context, reporter, assignee, status, and event history. |
| Internal note panel | `/reports/:id` | `internal-note-panel.png` | Open a report and capture the note form plus existing notes. |
| Moderation action panel | `/reports/:id` | `moderation-action-panel.png` | Capture the action selector and reason field before submission. |
| Audit logs page | `/audit-logs` | `audit-logs.png` | Show action, actor, entity, entity ID, created timestamp, and metadata. |

## Placeholder Policy

It is acceptable for this directory to contain only this README until actual screenshots are captured. When image files are added, use the filenames above so the root README can link to them predictably.

## Capture Tips

- Seed the database before capturing so the report queue is not empty.
- Use the moderator account for the primary flow.
- For audit log screenshots, assign a report, add a note, and take an action first so the page has meaningful rows.
- Crop browser chrome only if it improves readability.
- Do not include `.env` files, JWT tokens, or local database connection strings.
