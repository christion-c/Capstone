# CI

`workflows/validate.yml` runs on every push and pull request. Four independent jobs:

| Job | Checks | Working directory |
| --- | --- | --- |
| `backend` | `npm ci`, typecheck, build, test (against a real Postgres service container) | `apps/backend` |
| `frontend` | `npm ci`, lint, typecheck, `expo install --check`, static web export | `apps/frontend` |
| `ml` | install, `pip check`, `pip-audit`, import-sanity check, `pytest` | `services/ml` |
| `docker-build` | builds the backend and ML production Docker images (build-only, no push) so a broken Dockerfile fails CI instead of surfacing at deploy time | repo root |

No job deploys anything — see the root `README.md`'s "Deploying" section and `apps/backend/README.md` for the actual deploy commands, which are run manually.
