---
title: "End-to-end tests"
---

`apps/e2e` runs user journeys in Chromium against the real stack: CouchDB, Postgres, the API and the web app, built from the repository's `dockerfile`. Each test signs up a new account, so tests share the stack and run in parallel.

## Running the tests

Start the stack. The first start builds the images, which takes a few minutes:

```bash
pnpm --filter @oboku/e2e stack:up
```

Then run the smoke tests:

```bash
pnpm e2e
```

The command builds `@oboku/shared` first, because the tests call the admin API through its generated functions. The first run needs Playwright's Chromium:

```bash
pnpm --filter @oboku/e2e exec playwright install --only-shell chromium
```

After a change to the API or the web app, run `stack:up` again to rebuild the images. Stop the stack and delete its data with:

```bash
pnpm --filter @oboku/e2e stack:down
```

## The stack

`apps/e2e/docker-compose.yml` publishes its ports on the loopback interface only: the web app on `http://localhost:4280`, and the API on ports 4281 to 4283 through the `apps/dev-proxy` configuration. The ports differ from the development stack's, so both can run at the same time.

CouchDB, Postgres and the API run on a network with no internet access, so the API's metadata lookups (Google Books, OpenLibrary and others) always fail. In the browser, the tests abort every request to a host other than `localhost`. What a test sees then depends on the app only.

## Writing a test

Import `test` and `expect` from `apps/e2e/src/fixtures.ts`, not from `@playwright/test`. Its fixtures:

- `signUpInvitation`: a sign-up link for a new email address, and the password to complete the sign-up with. The admin API creates the link, so the stack needs no email provider.
- `context`: aborts every request to a host other than `localhost`, and installs the web app's service worker before the test's page opens. The app has a known bug: it reloads when a service worker first takes control of a page. A page opened before the worker is installed reloads during the test.

The books the tests add are in `apps/e2e/fixtures/books`, with their source and licence in `SOURCES.md`. Add only books whose licence allows redistribution.

Wait on what the screen shows, never on a fixed delay. A book added from the device is saved on the device after it appears in the library: wait for its **Read** button before opening it.

## In CI

The `e2e` workflow runs the smoke tests on every pull request, except one that changes only Markdown, the agent skills, or the admin, Android, docs or landing apps. On a failure, it prints the stack's logs and uploads the Playwright report, with a trace of the failed test.
