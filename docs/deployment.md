# Deployment

TrustOps deploys as a simple monorepo stack:

- Web dashboard: Vercel
- Backend API: Render
- Database: Supabase Postgres

Live web demo: TBD

Live API health check: TBD

Demo credentials are seeded into the Supabase-backed demo database and should use synthetic data only.

## Supabase Postgres

1. Create a Supabase project.
2. Copy the pooled or direct PostgreSQL connection string from the Supabase dashboard.
3. Use a Prisma-compatible connection string and include the schema parameter:

```bash
postgresql://postgres:<password>@<supabase-host>:5432/postgres?schema=public
```

4. Set `DATABASE_URL` in the Render API service environment.
5. Run Prisma migrations with `prisma migrate deploy` through the Render build/start workflow or from a Render shell.
6. Run the seed script once to create synthetic demo data.

Never commit Supabase credentials. TrustOps uses Supabase Postgres as the database only; Supabase Auth, Storage, Realtime, and RLS are not part of this stack.

## Render API

Create a Render Web Service for the API from the repository.

If the Render service root directory is the repository root, use these commands:

```bash
npm install && npm run db:generate -w apps/api && npm run db:deploy -w apps/api && npm run build -w apps/api
```

```bash
npm run start -w apps/api
```

If the Render service root directory is `apps/api`, use these commands:

```bash
npm install
npm run build
```

```bash
npm run start
```

Required environment variables:

```bash
PORT=3000
DATABASE_URL=postgresql://postgres:<password>@<supabase-host>:5432/postgres?schema=public
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
WEB_APP_ORIGIN=https://<vercel-web-url>
REDIS_HOST=<redis-host>
REDIS_PORT=6379
```

Render provides `PORT` at runtime. Keep it available to the API and do not hardcode a deployed port.

Health check path:

```bash
/health
```

Migration command from the repository root:

```bash
npm run db:deploy -w apps/api
```

Seed command from the repository root:

```bash
npm run db:seed -w apps/api
```

Run the seed command once for demo setup. The seeded demo credentials include:

```bash
mod@trustops.dev / Password123!
```

## Vercel Web

Create a Vercel project for the dashboard.

The web app lives in `apps/web`. Configure the Vercel project root directory as `apps/web`, or use equivalent monorepo settings that build that workspace.

Required environment variable:

```bash
NEXT_PUBLIC_API_URL=https://<render-api-url>
```

Rebuild the Vercel project after changing `NEXT_PUBLIC_API_URL`; Next.js reads this public variable at build time.

Make sure the Render API `WEB_APP_ORIGIN` exactly matches the Vercel deployment URL. Do not use wildcard CORS in deployed environments.

## Deployment Verification Checklist

- Visit Render API `/health`.
- Visit Vercel dashboard URL.
- Login using `mod@trustops.dev` / `Password123!`.
- Open report queue.
- Open report detail.
- Assign report.
- Add internal note.
- Take moderation action.
- Confirm audit log entry appears.

## Troubleshooting

- CORS error means `WEB_APP_ORIGIN` does not match the Vercel URL.
- Login fails if `NEXT_PUBLIC_API_URL` points to the wrong API.
- Prisma errors may mean `DATABASE_URL` is incorrect or migrations were not deployed.
- Empty dashboard may mean the seed script was not run.
- Render cold starts may make the first request slow.
