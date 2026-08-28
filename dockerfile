# node:24 no longer bundles corepack, so install pnpm explicitly, reading the
# version from the root package.json `packageManager` field so it cannot drift.
FROM node:24 AS node-pnpm
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install -g "pnpm@$(node -p 'require("./package.json").packageManager.replace(/^pnpm@/, "").split("+")[0]')"

# pnpm needs every workspace manifest present to install with a frozen
# lockfile, so the base stage installs once for the whole monorepo and app
# stages only add their sources and build.
FROM node-pnpm AS base
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json nx.json ./
COPY patches ./patches
COPY scripts ./scripts
COPY packages ./packages
COPY config ./config
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/landing/package.json ./apps/landing/package.json
RUN pnpm install --frozen-lockfile

FROM node-pnpm AS api
WORKDIR /usr/src/app
COPY --from=base /usr/src/app .
COPY apps/api ./apps/api
RUN pnpm exec lerna run build --scope=@oboku/api
WORKDIR /usr/src/app/apps/api
CMD ["node", "dist/main"]

FROM node-pnpm AS admin-build
WORKDIR /usr/src/app
COPY --from=base /usr/src/app .
COPY apps/admin ./apps/admin
RUN pnpm exec lerna run build --scope=@oboku/admin
WORKDIR /usr/src/app/apps/admin

FROM nginx:alpine AS admin
WORKDIR /usr/src/app
ENV APP_PREFIX=VITE_
ENV ASSET_TEMPLATE_DIR=/usr/share/nginx/html-template
ENV ASSET_DIR=/usr/share/nginx/html
COPY apps/admin/nginx.default.conf /etc/nginx/conf.d/default.conf
COPY scripts/docker/env.sh /docker-entrypoint.d/env.sh
RUN dos2unix /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
COPY --from=admin-build /usr/src/app/apps/admin/dist ${ASSET_TEMPLATE_DIR}
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

FROM node-pnpm AS web-build
ARG GITHUB_SHA
ENV GITHUB_SHA=${GITHUB_SHA}
WORKDIR /usr/src/app
COPY --from=base /usr/src/app .
COPY apps/web ./apps/web
RUN pnpm exec lerna run build --scope=@oboku/web
WORKDIR /usr/src/app/apps/web

FROM nginx:alpine AS web
WORKDIR /usr/src/app
ENV APP_PREFIX=VITE_
ENV ASSET_TEMPLATE_DIR=/usr/share/nginx/html-template
ENV ASSET_DIR=/usr/share/nginx/html
COPY apps/web/nginx.default.conf /etc/nginx/conf.d/default.conf
COPY scripts/docker/env.sh /docker-entrypoint.d/env.sh
RUN dos2unix /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
COPY --from=web-build /usr/src/app/apps/web/dist ${ASSET_TEMPLATE_DIR}
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

FROM couchdb:3.5.1 AS couchdb
COPY ./apps/couchdb/config/default.ini /opt/couchdb/etc/default.d/oboku.ini
COPY ./apps/couchdb/update-secrets.sh /usr/local/bin/

# The docker-compose healthcheck curls /_up; if a base-image bump ever drops
# curl, fail the build here rather than let the API silently block forever on
# an unhealthy couchdb (its depends_on waits for service_healthy).
RUN command -v curl >/dev/null || { echo "curl missing from couchdb base image; docker-compose healthcheck requires it" >&2; exit 1; }

# Create a custom entrypoint wrapper script
RUN echo '#!/bin/sh\n\
# Run your custom script first\n\
if [ -f /usr/local/bin/update-secrets.sh ]; then\n\
  echo "Running update-secrets.sh..."\n\
  /usr/local/bin/update-secrets.sh || { status=$?; echo "ERROR: update-secrets.sh exited with non-zero status: ${status}"; exit "${status}"; }\n\
fi\n\
\n\
# Then execute the original entrypoint with all arguments\n\
echo "Starting CouchDB..."\n\
exec /docker-entrypoint.sh "$@"' > /custom-entrypoint.sh && \
chmod +x /custom-entrypoint.sh

ENTRYPOINT ["/custom-entrypoint.sh"]
CMD ["/opt/couchdb/bin/couchdb"]
