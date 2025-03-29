FROM node:22 AS base
WORKDIR /usr/src/app
# @todo use upcoming exclude option to filter out stuff we dont need
# ideally we want to at least strip `apps` so that sub target build
# their own scope.
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY lerna.json ./
COPY nx.json ./
RUN npm ci

# We will work with the monorepo entirely since
# we have sub packages that need to be built
FROM node:22 AS api
WORKDIR /usr/src/app
# @todo use exclude to remove lot of stuff
COPY --from=base /usr/src/app .
COPY apps/api ./apps/api
# should only install missing packages from API
RUN npm ci
RUN npx lerna run build --scope=@oboku/api
WORKDIR /usr/src/app/apps/api
CMD ["node", "dist/main"]

FROM node:22 AS web-build
WORKDIR /usr/src/app
COPY --from=base /usr/src/app .
COPY apps/web ./apps/web
RUN npm ci
RUN npx lerna run build --scope=@oboku/web
WORKDIR /usr/src/app/apps/web

FROM nginx:alpine AS web
WORKDIR /usr/src/app
COPY --from=web-build /usr/src/app/apps/web/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]

FROM couchdb AS couchdb
COPY ./apps/couchdb/config/default.ini /opt/couchdb/etc/default.d/oboku.ini
COPY ./apps/couchdb/update-secrets.sh /usr/local/bin/
CMD ["/bin/sh", "-c", "/usr/local/bin/update-secrets.sh && exec /opt/couchdb/bin/couchdb"]
