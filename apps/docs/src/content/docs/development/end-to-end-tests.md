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

The API mounts `apps/e2e/fixtures/books` read-only. The stack is configured for the tests:

- Before the tests start, `src/globalSetup.ts` turns on [Server Sync](/self-hosting/server-sync) with that folder as its source, through the admin API.
- Google Drive and OneDrive get placeholder ids from `src/globalSetup.ts`, and Dropbox gets one from the compose file, so the app offers them as the hosted app does. The Google ids also turn on Google sign-in and the Google Books lookups. All of them fail, because the tests reach no outside host.

## Writing a test

Import `test` and `expect` from `apps/e2e/src/fixtures.ts`, not from `@playwright/test`. Its fixtures:

- `signUpInvitation`: a sign-up link for a new email address, and the password to complete the sign-up with. The admin API creates the link, so the stack needs no email provider.
- `context`: aborts every request to a host other than `localhost`.

`src/steps.ts` holds the steps the tests take in the app:

- `signUp`: completes the sign-up from a `signUpInvitation`.
- `addServerLibrary`: sets a master password, saves the Server Sync password as a secret, adds a connector and a server library sync, and waits for its first sync.
- `expectServerLibraryBooks`: waits until the library shows each server book's title and author, each in its card, which `libraryBookCard` finds by its title. The API reads them from each file, which can take up to a minute when tests run in parallel.
- `openBookDetails`, `downloadFromDetailsScreen` and `readFromDetailsScreen`: open a book's details from the library, download the book, and open it in the reader.

`src/reader.ts` finds a page in the reader: by the path of the book document it shows, or the first page, and `expectReaderPageRevealed` waits for the page to fade in. A comic's pages, and the pages of a book opened before the service worker controls the page, have `blob:` addresses that name no document. An audiobook's track has no document: `firstAudioTrackWave` finds the wave the reader draws for it.

The books are in `apps/e2e/fixtures/books`, with their source and licence in `SOURCES.md`. Add only books whose licence allows redistribution. A book added there also appears in every library that `addServerLibrary` syncs, so list it in `SERVER_LIBRARY_BOOKS` in `src/library.ts` too: the server library test and the screenshots read that list.

Wait on what the screen shows, never on a fixed delay. A book added from the device is saved on the device after it appears in the library: wait for its **Read** button before opening it.

## Screenshots

The `screenshots` Playwright project captures every screenshot of the app from the same stack: the Play Store set, the web manifest images and the landing images.

```bash
pnpm screenshots
```

`tests/screenshots/scenes.spec.ts` holds two tables:

- **The scenes:** each has the steps that show one screen, and is named after it. Every target captures them in the order the table declares them: `home`, `library`, `book-details`, `manage-storage`, `library-syncs`, `add-library-sync`, `profile`, `optimize-content`, `optimize-metadata`, `koreader-sync-server`, `koreader-progress-sync`, `epub-reader`, `manga-reader`, `audiobook-reader` and `library-e-ink`. A reader scene closes the reader in the app, because a reader left open makes the next page load offer to go back to it, over the screen. It still leaves its book in progress, so the reader scenes come after the scenes that show reading progress. `library-e-ink` leaves the app in e-ink, so it comes last, after the reader scenes: where their books are in view, it shows them in progress. `epub-reader` and `audiobook-reader` show the reader's menu, and `manga-reader` shows the page alone. Use `epub-reader` wherever one image shows the reader. `koreader-sync-server` turns on the KOReader sync server, and `koreader-progress-sync` offers it to oboku's reader, so a target that captures `koreader-progress-sync` captures both.
- **The targets:** each sets a viewport, a scale, a theme, a locale and an image format, and lists the scenes it captures. It saves each scene as `<scene>` and the extension of its format, in its own folder, listed in the table below. The run fails if the folder holds another file, other than a hidden one.

| Target         | Size                            | Scenes                                         | Format                                       | Saved to                                            |
| -------------- | ------------------------------- | ---------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| `play-phone`   | 360 × 640 at 3×, so 1080 × 1920 | home, library, book details, the three readers | PNG                                          | `apps/e2e/screenshots/play-phone/en/`               |
| `web-manifest` | 320 × 568 at 2×, so 640 × 1136  | home, library, EPUB reader                     | JPEG, quality 85                             | `apps/web/public/manifest-screenshots/`             |
| `landing`      | 375 × 667 at 2×, so 750 × 1334  | all of them                                    | WebP, the smaller of lossless and quality 90 | `apps/landing/src/features/common/app-screenshots/` |

Each committed image is in the smallest format its destination takes, and the uncommitted Play Store set stays lossless:

- Google Play takes JPEG or 24-bit PNG.
- Chrome's install dialog takes PNG and JPEG screenshots only.
- The landing serves its images through `next/image`, which takes WebP and re-encodes each image for each screen size. Its Open Graph image converts the library screenshot to PNG, because `next/og` draws no WebP image.

To update the screenshots, capture them in one of two ways:

- **In CI.** In GitHub, open **Actions**, select **e2e**, then **Run workflow**. The `screenshots` job uploads two artifacts: `play-phone-screenshots`, the Play Store set, and `app-screenshots`, the web manifest and landing images under their paths from `apps/`.
- **On your computer.** Run `stack:up` to rebuild the stack from the checkout, then `pnpm screenshots`.

Then commit the web manifest and landing images that changed. Leave out an image whose only change is one of those listed below. The Play Store set is not committed: upload it in the Play Console, from the artifact or from `apps/e2e/screenshots`.

Each target signs up a new account, syncs and downloads the server library, reads the first chapter of _The Time Machine_ and opens the _Little Nemo_ comic, so Home shows both as books in progress. The manga reader opens _人の一生_, and the audiobook reader opens the LibriVox recording of _The Time Machine_. The Optimize screen shows the image compression of _Little Nemo_ and the identifiers of _Treasure Island_. The screens are English only: the French catalog covers the settings screen alone. A French target becomes one more row once the main screens are translated.

On the same machine, a run gives the same images as the run before, except for what the stack cannot fix:

- The profile and both KOReader screens show the email of the account, which each run creates with a new address.
- The Syncs screen shows the day of the last sync, which the API records.
- The KOReader sync server screen shows the password the API generates.
- The storage screen shows the browser's estimate of the space the machine has, and lists the books in no fixed order.

To keep the rest the same:

- The time zone is UTC, and the clock reads 09:41 when each scene starts. The clock keeps running, because the app's timers stall when it stops.
- Each capture waits for the splash screen to go, every dialog to close except the drawer a scene opens, the reader page to fade in, and the images and book covers to load. The screenshot itself waits for the fonts.
- The context reports the storage as persisted, as it is in the installed app. Headless Chromium never grants it, and the app would show an unread notification about it.

## In CI

The `e2e` workflow runs the smoke tests on every pull request, except one that changes only Markdown, the agent skills, or the admin, Android, docs or landing apps. A manual run also captures the screenshots, in the `screenshots` job. On a failure, each job prints the stack's logs and uploads the Playwright report, with a trace of the failed test.
