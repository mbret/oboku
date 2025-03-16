FROM node:22 AS base
WORKDIR /usr/src/app
# @todo use upcoming exclude option to filter out stuff we dont need
# ideally we want to at least strip `apps` so that sub target build
# their own scope.
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY lerna.json ./
COPY nx.json ./

RUN npm install

# We will work with the monorepo entirely since
# we have sub packages that need to be built
FROM node:22 AS api
WORKDIR /usr/src/app
# @todo use exclude to remove lot of stuff
COPY --from=base /usr/src/app .
COPY apps/api ./apps/api
# should only install missing packages from API
RUN npm install
RUN npx lerna run build --scope=@oboku/api
WORKDIR /usr/src/app/apps/api
CMD ["node", "dist/main"]