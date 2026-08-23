# syntax=docker/dockerfile:1.7
#
# Development only - there is no production stage here. This image runs
# the Metro dev server (see the CMD at the bottom) for local docker
# compose use; it is never built or deployed for production. The real
# production artifact is the static web export (`npm run export:web`,
# verified in CI) deployed to Firebase Hosting - see firebase.json and
# .firebaserc at the repo root.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS development

WORKDIR /workspace

ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_update_notifier=false

RUN chown node:node /workspace

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci

COPY --chown=node:node . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan", "--port", "8081"]
