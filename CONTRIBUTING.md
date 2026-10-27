# Contributing to oboku

Bug reports, feature requests, documentation fixes and code are all welcome. Everyone who takes part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ask a question

Ask on [Discord](https://discord.gg/eB6MrMmmPN) or [Reddit](https://www.reddit.com/r/oboku/), whether it is about using oboku, self-hosting it or working on the code. Keep GitHub issues for bugs and feature requests.

## Report a bug or request a feature

Open an issue on [GitHub](https://github.com/mbret/oboku/issues) after checking that nobody reported it already. Report a security vulnerability privately instead, as [SECURITY.md](SECURITY.md) explains.

A useful bug report says:

- what you did, what you expected and what happened instead;
- where oboku runs: [app.oboku.me](https://app.oboku.me), or self-hosted with the image tag you use;
- your browser and device;
- the book format and sync provider involved, such as an EPUB from Google Drive;
- any error from the browser console or the API logs.

For a feature request, describe the problem it solves before the solution you have in mind.

Issues labelled [good first issue](https://github.com/mbret/oboku/labels/good%20first%20issue) are a good place to start contributing code.

## Set up the project

### Prerequisites

- [Node.js](https://nodejs.org/) 24, the version in [`.nvmrc`](.nvmrc).
- [pnpm](https://pnpm.io/installation) 11. The `packageManager` field in [`package.json`](package.json) pins the exact version.
- [Docker](https://docs.docker.com/get-started/get-docker/) with Docker Compose, which runs CouchDB and Postgres.

### Install

Fork the repository, clone your fork and install the dependencies:

```bash
git clone https://github.com/<your-username>/oboku.git
cd oboku
pnpm install
```

Some tests run in a real browser. Install the Chromium they use once, then again whenever Playwright is upgraded:

```bash
pnpm exec playwright install chromium
```

### Configure

Create `.env` at the repository root. Docker Compose reads it to start CouchDB and Postgres. Any password works locally.

```bash
COUCHDB_PASSWORD=password
POSTGRES_PASSWORD=password
```

Create `apps/api/.env` for the API:

```bash
NODE_ENV=development
APP_PUBLIC_URL=http://localhost:5173
COUCH_DB_URL=http://localhost:5984
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=password
API_DATA_DIR=./.data
API_CONFIG_DIR=./.config
JWT_PRIVATE_KEY_FILE=../../secrets/jwt_private_key.pem
JWT_PUBLIC_KEY_FILE=../../secrets/jwt_public_key.pem
ADMIN_LOGIN=admin
ADMIN_PASSWORD=password
```

`POSTGRES_PASSWORD` must match the one in the root `.env`.

On its first start, the CouchDB container writes a JWT key pair to `secrets/` at the repository root. `JWT_PRIVATE_KEY_FILE` and `JWT_PUBLIC_KEY_FILE` point there.

The [environment variables](apps/docs/src/content/docs/self-hosting/configuration/environment-variables.md) page covers the optional settings, such as an email provider for signing up by email.

### Run

```bash
pnpm start
```

`pnpm start` starts CouchDB, Postgres and a dev proxy from [`docker-compose.dev.yml`](docker-compose.dev.yml), builds the API, then runs the web app, the admin panel, the API and the shared packages in watch mode.

| URL | Service |
| --- | --- |
| http://localhost:5173 | Web app |
| http://localhost:3003 | Admin panel |
| http://localhost:3000 | API |

Ctrl+C stops the apps. The containers keep running until `docker compose -f docker-compose.dev.yml down`.

`pnpm start:landing` runs the [oboku.me](https://oboku.me) landing page, which `pnpm start` leaves out.

### Create an account

This setup configures no email provider, so create your account from the admin panel:

1. Sign in at http://localhost:3003 with `ADMIN_LOGIN` and `ADMIN_PASSWORD`.
2. Generate a link under **Sign up links**.
3. Open the link, finish signing up, then sign in at http://localhost:5173.

## Check your change

CI runs these commands ([`.github/workflows/check.yml`](.github/workflows/check.yml)). Run them before you open a pull request.

| Command | What it checks |
| --- | --- |
| `pnpm lint` | Lint and formatting, with Biome. `pnpm format` fixes the formatting. |
| `pnpm build` | Builds every package. Each build runs the TypeScript compiler, so this is also the typecheck. |
| `pnpm test` | Every package's Vitest suite. `pnpm --filter @oboku/web test` runs a single package. The web app's tests, and files named `*.browser.test.ts` in the packages, run in headless Chromium through [Vitest browser mode](https://vitest.dev/guide/browser/). |
| `pnpm check:service-worker` | Registers the web app's built service worker in headless Chromium, after `pnpm build`. Fails when the worker throws while it loads or does not install. |
| `pnpm generate:api-types` | Regenerates the [API types](apps/docs/src/content/docs/development/api-types.md) from the API's controllers. CI fails when the output differs from the committed files. |

A pre-commit hook runs Biome on the staged files and applies its fixes.

Read [AGENTS.md](AGENTS.md) before writing code. It holds the engineering rules that reviews apply, for people and AI coding tools alike.

## Branches and pull requests

- Branch from `develop` and open your pull request against `develop`, the default branch.
- `master` is the release branch. The maintainer merges `develop` into it to ship a release.
- Keep a pull request to one change. Say what changed and why, and link the issue it closes (`Fixes #123`).
- Add screenshots or a short video when the UI changes.
- Update the [documentation](#documentation) in the same pull request when behaviour changes.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `type(scope): summary`, where the scope is optional and names the area touched. For example:

```text
fix(web): save the reading position instead of the first visible page
feat(api): move to nestjs 12, es modules and vitest
docs(self-hosting): say untagged images already run the release
```

On `master`, [semantic-release](https://github.com/semantic-release/semantic-release) reads the commits to pick the next version and write the release notes:

| Commit | Release |
| --- | --- |
| `feat: …` | Minor |
| `!` after the type (`feat!: …`), or a `BREAKING CHANGE:` footer | Major |
| Any other type: `fix`, `perf`, `refactor`, `docs`, `chore`… | Patch |

Use the format for every commit and for the pull request title, since either can end up on `master`. Pick a type listed in [`release.config.mjs`](release.config.mjs): the release notes leave out any other type.

## Documentation

The user and self-hosting docs live in [`apps/docs/src/content/docs/`](apps/docs/src/content/docs/), built with [Starlight](https://starlight.astro.build/) and published to [docs.oboku.me](https://docs.oboku.me). Edit the Markdown there, in the same pull request as the change it documents.

- A page's title is the `title` field of its frontmatter, and its body starts at `##`.
- A new page needs an entry in the `sidebar` of [`apps/docs/astro.config.ts`](apps/docs/astro.config.ts).
- Link another page by its path on the site, such as `/guides/directives`, not by its file. The docs build fails on a broken link or anchor.
- Callouts are `:::note`, `:::tip`, `:::caution` or `:::danger`, closed by `:::`.
- Images go in `apps/docs/public/images/`, referenced as `/images/<name>.png`.
- A heading that ends in `{ #id }` keeps the anchor older links point to. Keep it when you reword the heading.
- When you move or rename a page, redirect its old path in [`apps/docs/vercel.json`](apps/docs/vercel.json).
- `pnpm start:docs` serves the site while you write.

[`apps/docs/src/content/docs/development/`](apps/docs/src/content/docs/development/) explains parts of the internals, such as [authentication](apps/docs/src/content/docs/development/authentication.md).

## License

oboku is licensed under the [GNU General Public License v3.0](LICENSE). Your contributions are released under the same license.
