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

The API mounts `apps/e2e/fixtures/books` read-only. Before the tests start, `src/globalSetup.ts` turns on [Server Sync](/self-hosting/server-sync) with that folder as its source, through the admin API.

## Writing a test

Import `test` and `expect` from `apps/e2e/src/fixtures.ts`, not from `@playwright/test`. Its fixtures:

- `signUpInvitation`: a sign-up link for a new email address, and the password to complete the sign-up with. The admin API creates the link, so the stack needs no email provider.
- `context`: aborts every request to a host other than `localhost`.

`src/steps.ts` holds the steps the tests take in the app:

- `signUp`: completes the sign-up from a `signUpInvitation`.
- `addServerLibrary`: sets a master password, saves the Server Sync password as a secret, adds a connector and a server data source, and waits for its first sync.
- `expectServerLibraryBooks`: waits until the library shows each server book's title and author. The API reads them from each file, which can take up to a minute when tests run in parallel.
- `openBookDetails`, `downloadFromDetailsScreen` and `readFromDetailsScreen`: open a book's details from the library, download the book, and open it in the reader.

`src/reader.ts` finds a page in the reader: by the path of the book document it shows, or the first page. A comic's pages, and the pages of a book opened before the service worker controls the page, have `blob:` addresses that name no document.

The books are in `apps/e2e/fixtures/books`, with their source and licence in `SOURCES.md`. Add only books whose licence allows redistribution. A book added there also appears in every library that `addServerLibrary` syncs, so list it in `SERVER_LIBRARY_BOOKS` in `src/library.ts` too: the server library test and the screenshots read that list.

Wait on what the screen shows, never on a fixed delay. A book added from the device is saved on the device after it appears in the library: wait for its **Read** button before opening it.

## Screenshots

The `screenshots` Playwright project captures the app's store and web manifest images from the same stack:

```bash
pnpm screenshots
```

`tests/screenshots/scenes.spec.ts` holds two tables:

- **The scenes:** home, library, book details, EPUB reader and comic reader. Each scene has the steps that show it. A reader scene also closes the reader in the app, because a reader left open makes the next page load offer to go back to it, over the screen.
- **The targets:** each sets a viewport, a scale, a theme and a locale, and lists the scenes it captures and the file each one is saved to.

| Target         | Size                            | Scenes                     | Saved to                                                        |
| -------------- | ------------------------------- | -------------------------- | --------------------------------------------------------------- |
| `play-phone`   | 360 × 640 at 3×, so 1080 × 1920 | all five                   | `apps/e2e/screenshots/play-phone/en/`                           |
| `web-manifest` | 320 × 568 at 2×, so 640 × 1136  | home, library, EPUB reader | `apps/web/public/`, in place of the files `manifest.json` lists |

No workflow captures the screenshots. To update them, start the stack and run `pnpm screenshots`, then commit the changed web manifest images. `apps/e2e/screenshots` is not committed: upload the Play Store set from it in the Play Console.

Each target signs up a new account, syncs and downloads the server library, reads the first chapter of _The Time Machine_ and opens the comic, so Home shows both as books in progress. The screens are English only: the French catalog covers the settings screen alone. A French target becomes one more row once the main screens are translated.

The images are the same from one run to the next on the same machine:

- The time zone is UTC, and the clock reads 09:41 when each scene starts. The clock keeps running, because the app's timers stall when it stops.
- Each capture waits for the splash screen to go, no dialog to show, the reader page to fade in, and the images and book covers to load. The screenshot itself waits for the fonts.
- The context reports the storage as persisted, as it is in the installed app. Headless Chromium never grants it, and the app would show an unread notification about it.

## In CI

The `e2e` workflow runs the smoke tests on every pull request, except one that changes only Markdown, the agent skills, or the admin, Android, docs or landing apps. On a failure, it prints the stack's logs and uploads the Playwright report, with a trace of the failed test.
