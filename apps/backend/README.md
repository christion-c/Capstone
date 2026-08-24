# Backend

Express/TypeScript REST API — the only thing in this project that talks to PostgreSQL directly, and the only thing that talks to the ML service. See the root [`README.md`](../../README.md#architecture) for how this fits into the rest of the stack, and [`docs/PROJECT_CONTEXT.md`](../../docs/PROJECT_CONTEXT.md) for current status and known gaps.

First-time environment setup (installing tools, authenticating `gcloud`, filling in `.env`) lives in the root [`README.md`](../../README.md) — this file covers the backend's own architecture, how to run/test it, and how to deploy it.

## Architecture

```
src/
  modules/<feature>/
    <feature>.routes.ts       Express router - auth, validation, response shaping
    <feature>.repository.ts   Database access for this feature
  lib/
    route-helpers.ts          withCurrentUser, asyncHandler, respondNotFound, etc. - shared by every route
    db-helpers.ts             expectOneRow, numericOrNull - shared by every repository
  middleware/                 requireAuth (Firebase token verification), requireInternalService, syncCurrentUser
  config/                     env.ts (validated startup config), firebase.ts
  db/
    pool.ts                   the pg Pool
    migrations/                one file per migration, auto-run at startup
```

Every feature module follows the same `<feature>.routes.ts` + `<feature>.repository.ts` split — `budget`, `finance`, `fill-up-history`, `predictions`, `vehicles`, `auth`, `users`. Routes never touch the database directly; repositories never touch `request`/`response`.

`modules/predictions/predictions.client.ts` is the backend's client for the ML service (`requestForecast` for `/predict`, `requestPreview` for the debug-only `/ml-preview` flow). The frontend never calls the ML service directly — every request goes through here, authenticated with the caller's verified identity, so the ML service's internal token never needs to leave the backend.

## Migrations

Migrations in `src/db/migrations/` run automatically every time the server starts (`runMigrations()` in `server.ts`, before the HTTP server begins listening) — there's no separate `npm run migrate` step. The migration runner is idempotent and takes a Postgres advisory lock, so it's safe for multiple instances to start concurrently. To add one, add a new file to `src/db/migrations/` following the existing numbering.

## Environment variables

Validated once at startup (`src/config/env.ts`) — the process refuses to start if a required one is missing or malformed.

| Variable                 | Required | Notes                                                                                        |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | yes      | no default - the app won't start without a real database                                     |
| `INTERNAL_SERVICE_TOKEN` | yes      | shared secret for service-to-service routes (the ML service calling back into this API)      |
| `ML_SERVICE_URL`         | no       | defaults to `http://ml:8000` (the Docker Compose service name); set explicitly in production |
| `CORS_ORIGIN`            | no       | defaults to `*`; production sets this to the real frontend origin(s)                         |
| `PORT`                   | no       | defaults to `3000`                                                                           |
| `NODE_ENV`               | no       | `development` / `test` / `production`, defaults to `development`                             |

## Running and testing locally

Through Docker (recommended — see the root README for the full local-dev flow):

```bash
docker compose --profile frontend --profile ml up --watch
```

Directly on the host, if you'd rather not use Docker for backend work specifically:

```bash
cd apps/backend
npm ci
npm run typecheck
npm test
```

`npm test` needs a reachable Postgres — either the one `docker compose up` already started (`localhost:5433`), or point `DATABASE_URL` at your own. Tests that need the database self-skip with a clear message if it isn't reachable, rather than failing.

## Deploying

Build from the **repo root**, not `apps/backend` — the Docker build context spans the whole repo so it can reach `packages/shared-types`.

```bash
docker build -f infra/docker/backend/Dockerfile --target production \
  -t us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest .

docker push us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest

gcloud run deploy thinktwice-backend \
  --image us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest \
  --region us-east4
```

No env vars or secrets need restating on a redeploy like this — Cloud Run keeps whatever's already configured on the service (`DATABASE_URL` and `INTERNAL_SERVICE_TOKEN` via Secret Manager, `CORS_ORIGIN`, `ML_SERVICE_URL`, the Cloud SQL connection) and just swaps the image.

**Two gotchas:**

- `--set-env-vars` / `--set-secrets` **replace the entire list** on the service; `--update-env-vars` / `--update-secrets` patch just what you name. Default to `--update-*` unless you're deliberately restating everything.
- If a value you're passing on the command line has commas in it (multiple `KEY=VALUE` pairs in one `--set-env-vars`), Windows/PowerShell + `gcloud`'s `.cmd` wrapper can mangle the commas. Use one `--set-env-vars`/`--update-env-vars` flag per variable instead of comma-joining them.

## Resource reference

| Thing                       | Value                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| GCP project                 | `thinktwice-dev-christion`                                                                |
| Backend service account     | `thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com`                 |
| Cloud Run region            | `us-east4`                                                                                |
| Cloud Run services          | `thinktwice-backend`, `thinktwice-ml`                                                     |
| Live backend URL            | https://thinktwice-backend-93723759667.us-east4.run.app                                   |
| Live ML service URL         | https://thinktwice-ml-93723759667.us-east4.run.app                                        |
| Artifact Registry repo      | `us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice`                             |
| Cloud SQL instance          | `thinktwice` (region `us-central1` — different region than Cloud Run, that's intentional) |
| Cloud SQL connection name   | `thinktwice-dev-christion:us-central1:thinktwice`                                         |
| Secret Manager secrets      | `db-url`, `internal-service-token`                                                        |
| Firebase project            | `thinktwice-dev-christion`                                                                |
| Firebase Hosting (frontend) | https://thinktwice-dev-christion.web.app                                                  |
| Custom domain               | `thinktwice.site`                                                                         |

To see or rotate a secret's value:

```bash
gcloud secrets versions access latest --secret=db-url
gcloud secrets versions access latest --secret=internal-service-token
```
