# AGENTS.md

## Engineering principles in this repository

- When implementing changes in this codebase, prioritize consistency and consolidation over novelty.

### Code comments

- **Default to no comments.** Code, names, and types are the documentation. Add a comment only when a future reader cannot recover the intent from the code itself.
- **Never restate what the code does.** If the comment paraphrases the next line, delete it.
- **Never explain a change you are making.** Comments are about the resulting code, not about the diff or the review that produced it.
- **Never narrate trivial mechanics** ("seed the form", "fall back to default", "guard for unmount", "cleanup on success", "preserves siblings", etc.). If the function/variable name doesn't already say that, rename instead of commenting.
- **No "why" boilerplate.** Don't write comments like "we do X so that Y" unless Y is genuinely surprising and not visible from reading the function. A two-word identifier (`safeFallback`, `corsHeaders`, …) usually beats a three-line comment.
- **Allowed comments** (rare, deliberate):
    - Workarounds for third-party bugs, with a link or version reference.
    - Non-obvious invariants or ordering constraints that aren't enforced by the type system.
    - Explanations *required* by another rule in this file (e.g. the `as` rule, the MUI polymorphic-strip cast rule).
    - Spec citations when the code implements a non-trivial part of an external spec.
- **JSDoc on exported APIs is fine** when it documents the *contract* (parameters, return shape, edge cases) — not when it restates the implementation.
- **Delete stale comments aggressively.** A comment that lies is worse than no comment.

### Self-explanatory code over comments

- **Make naming carry the intent a comment would have carried.** Before writing a comment, try to encode the same information in a name. Prefer renaming over annotating.
- **Name boolean conditions and predicates.** Extract a condition into a named variable or small predicate (`isWakeLockSupported()`, `isDocumentVisible()`, `wasUnmountedWhileRequesting`) whenever its purpose is not obvious from the expression, however short that expression is. The trigger is the reader asking "why are we comparing these?", not the size of the comparison: `if (user.couchName !== couchUser.name)` says what is compared, `const isCouchNameRecorded = user.couchName === couchUser.name` says what the comparison decides. Name the state the condition establishes, in the positive form, negate at the branch (`if (!isCouchNameRecorded)`), and declare it right above the branch that uses it.
- **Name every function expression, including callbacks.** Pass named functions to `useEffect`, its cleanup return, event handlers, timers, and promise callbacks (e.g. `useEffect(function keepScreenAwakeWhileMounted() { ... }, [])`, `return function releaseWakeLockOnUnmount() { ... }`, `onWakeLockReleasedByOs`). Named functions document purpose at the call site and show up by name in stack traces and DevTools. Anonymous arrows are fine for `describe`/`it` bodies in tests (the string argument already names them) and for trivial one-line array callbacks like `.map((tag) => tag._id)`.
- **Name intermediate values** rather than commenting what a literal or expression means. A descriptive `const` is preferable to an inline value plus a comment.
- **The goal:** a reader should understand *what* and *why* from identifiers and structure alone. Comments remain reserved for the rare cases listed under "Code comments" above (third-party workarounds, non-obvious invariants, spec citations).

### Reuse before creating

- Always look for existing components, hooks, utilities, routes, and data-access patterns before adding new ones.
- Extend or compose existing abstractions when possible instead of introducing parallel implementations.
- If a near match exists, adapt it to support the new use case rather than duplicating logic.

### TypeScript `as` usage

- Avoid using TypeScript's `as` type assertions unless absolutely necessary.
- Only use `as` when there is no safer or more idiomatic alternative (for example, when interfacing with third-party or legacy data you cannot control).
- When you need to use `as`, always add a code comment explaining why it is required in that context.
- Prefer type guards, runtime validation, and stricter data structures to ensure type safety and clarity instead of using type assertions.
- Rationale: Overuse of `as` can hide bugs, undermine type safety, and reduce code maintainability and refactorability.

### New feature implementation

- New features should follow established naming, folder structure, API shape, and UI conventions already used in neighboring code.
- Keep behavior and architecture aligned with existing patterns unless there is a clear technical reason not to.
- If divergence is necessary, keep it minimal and document the reason in the PR/commit notes.
- Prefer using existing mutation/query status and returned data to drive UI state before introducing extra local component state. When a hook already exposes the success, error, pending, or data needed for rendering or navigation, derive from that first.

### Refactoring and cleanup expectations

- During feature work, opportunistically consolidate duplicated code paths into existing shared patterns where safe.
- Prefer small, incremental refactors that reduce pattern drift without broad unrelated rewrites.
- Do not introduce new abstractions unless they are reused or clearly expected to be reused.

### Browser support: no fallbacks, no shims

- **Assume an up-to-date browser.** Keeping the browser current is a product requirement, not something the code compensates for. Write simple, next-gen code.
- **Do not add fallbacks, shims, polyfills, or graceful degradation** for an API that is baseline across all major browsers (desktop *and* mobile). If such an API is missing at runtime, letting the process crash is the correct behaviour — a fallback path doubles the code, doubles the states to reason about, and is the path least likely to be exercised or tested.
- **Prefer crashing over silently degrading.** A capability check that quietly switches to a worse implementation hides the failure and makes the resulting bug much harder to find than an exception would have been.
- **Do flag an API that is *not* baseline everywhere.** If support is genuinely uneven across major desktop/mobile browsers, say so and let the user decide rather than silently working around it.
- **Ask before reaching for a very recent API.** When something is baseline but only recently (roughly within the last year or two), confirm with the user first instead of assuming — and do not silently downgrade to an older API to avoid asking.
- Rationale: the amount of code that exists purely to serve browsers nobody uses is a permanent tax on readability and correctness. `packages/archive-metadata`'s OPFS staging is the reference example — it requires OPFS and Web Locks outright and has no in-memory fallback path.

### Shared package (@oboku/shared)

- No user-facing content strings (error messages, labels, placeholders, etc.) should live in the shared package.
- Keep content strings colocated in the consuming app (e.g. web) so they can be localized and adjusted per product without touching shared code.
- The shared package may define error codes, types, and structure; the app defines the human-readable messages.

### API types are generated

- The request and response types for API routes are generated from the API's controllers and DTO classes. After changing a route, run `pnpm generate:api-types` and commit `packages/shared/src/api-types/generated/`. Never edit those files by hand, and never hand-write a request or response type for a route the document covers.
- Declare DTOs in `*.dto.ts` files and return a class from every route. The `@nestjs/swagger` plugin ignores classes declared in controller files and cannot read `type` aliases.
- At an HTTP call site, type the request and response with the route's generated types (`AuthSignInWithEmailData["body"]`, `AuthSignInWithEmailResponse`), so the call follows the route when its DTOs change.
- `apps/docs/src/content/docs/development/api-types.md` covers the workflow and which modules the document covers so far.

### Data migrations: RxDB is local, CouchDB is the data

- **An RxDB schema migration only rewrites the device's copy.** `migrationStrategies` rewrite the documents stored locally, keep their `_meta.lwt`, and rewrite RxDB's record of the server copy the same way, so the replication never pushes them. CouchDB keeps the old data, a new device pulls it unmigrated, and the next server-side change to a document overwrites the migrated copy. RxDB "assumes that you run the exact same migration on the servers and the clients" ([docs](https://rxdb.info/migration-schema.html)).
- Use RxDB migrations only as pass-throughs when a field is added (bump the schema version, return the document unchanged), or for data that never leaves the device.
- **To change stored data, migrate CouchDB.** Add a method to the API's `MigrationService` and an admin endpoint in `admin.controller.ts`, following the existing ones: idempotent, one bulk write per user database. Devices receive the result through replication.
- Older versions of the app keep running against the same data. When a field replaces another, keep reading the old one until they are gone, and say in a TODO when it can be removed.

### Package manager

- Use `pnpm` as the package manager for this repository (pinned via the `packageManager` field in the root `package.json`).
- Prefer `pnpm` commands over `npm` or `yarn` unless the user explicitly asks otherwise.
- When installing dependencies, running scripts, or reproducing CI/local workflows, follow the root `pnpm-lock.yaml` as the source of truth.
- Workspace-internal dependencies (`@oboku/*`) use the `workspace:*` protocol.
- pnpm does not hoist, so every package must declare what it imports; do not rely on transitive dependencies being resolvable.
- Dependency build scripts are opt-in via `allowBuilds` in `pnpm-workspace.yaml`; when pnpm reports newly ignored build scripts, add an explicit `true`/`false` entry there.

### prose-reader: read its docs, then confirm in its source

- **prose-reader and oboku have the same maintainer.** prose-reader is not a
  third-party black box: its repository is available, its behaviour is
  changeable, and a gap there is fixable rather than something to work around
  locally.
- **Docs for the overview, source for the facts.** Its guides live in the
  prose-reader repo under `apps/docs/src/content/docs/<package>/` (e.g.
  `apps/docs/src/content/docs/archive-reader/`), published at
  [doc.prose-reader.com](https://doc.prose-reader.com).
  Read them first for the broad picture: what each package owns, what its
  vocabulary means, how it is meant to be used. Then confirm every behaviour you
  rely on in prose-reader's `src/` and its tests, whether writing code against
  it or explaining it: the source is typed, commented, and states intent. The
  guides are hand-written alongside the code and can be stale, wrong, or silent.
- **oboku is prose-reader's first consumer and its debugging ground.** A guide
  that disagrees with the source, or prose-reader behaviour that looks wrong
  from oboku, is a finding, not something to route around. Say so, go with the
  source, and fix it upstream with a prose-reader issue or PR, for the guide or
  the code. When oboku cannot wait for the fix, link the upstream issue from the
  workaround.
- **Never reverse-engineer behaviour from `dist/`.** The published bundles are
  minified: they tell you what the code does and nothing about what it intends.
  Read `src/` in the repository instead — reaching for the built artifact when
  the real source is available is what produced the duplication below.
- **Treat "I am about to reimplement something archive-reader also does" as a
  hard stop.** Identifier schemes and their crosswalks (ONIX, MARC), catalog URL
  forms, container parsing, and metadata resolution all live upstream.
  Duplicating them has been the recurring mistake in this repository.
- **A field the resolved vocabulary omits is usually omitted deliberately.**
  `metadata` is what the resolver believes; `sources` is the verbatim parser
  output — what the book said. Container-specific detail lives in `sources`, so
  check there and in the docs before concluding something is unavailable
  upstream.
- If knowledge genuinely belongs upstream and is not there yet, prefer a
  prose-reader PR over a local copy, then upgrade oboku to the published version
  in its own PR.
- Smell test: if a test file uses a prose-reader helper to verify what the code
  under test computes by hand, the code under test should be using that helper.

### Synology API docs

- For Synology integrations, treat the public DSM Login Web API guide and File Station API guide as generic protocol references only.
- Do not assume the File Station docs define the contract for `SYNO.SynologyDrive.*` endpoints.
- The source of truth for Synology Drive API availability is the target NAS via `SYNO.API.Info`.
- When typing `SYNO.SynologyDrive.*` responses, prefer shapes validated against live NAS responses over guessed or loosely related public documentation.

### React-query mutations: global error toast (web)

- The web app's global `MutationCache.onError` (see `QueryClientProvider.tsx`) shows an error toast for every mutation failure unless the mutation sets `meta.suppressGlobalErrorToast`.
- `suppressGlobalErrorToast` is always the **consumer's** decision: only the call site knows whether the mutation is a standalone user-facing action (toast wanted) or is nested inside another mutation / background flow that owns its error handling (toast unwanted).
- Never hard-code `meta: { suppressGlobalErrorToast: true }` inside a reusable mutation hook. Instead, have the hook accept `options?: Pick<UseMutationOptions<...>, "meta">` and spread it into `useMutation` (see `useSignIn`, `useDeleteProfile`), letting each call site opt out of the toast.

### Web app tests: a real browser, one page per file

- Every web app test runs in headless Chromium through Vitest browser mode (`apps/web/vitest.config.ts`). Use the browser's own APIs (storage, `crypto`, `ProgressEvent`, workers, popups) instead of stubbing them.
- **A module is evaluated once per test file.** `vi.resetModules()` does nothing in a browser, so module-level state (a singleton client, a run-once promise) is shared by every test in the file. Declare mocks with a hoisted `vi.mock`, set each test's behaviour on `vi.hoisted` spies, and give a test that needs a module in its initial state a file of its own (see `auth.unconfigured.test.ts`).
- **A mock factory must export every name its importers use.** The browser refuses to load a module whose import the mock lacks. Spreading `await importOriginal()` covers that, but deadlocks when the real module's imports lead back to another mocked module: return the full export list instead.
- **Storage can outlive a test file.** localStorage, IndexedDB and OPFS can persist across the test files of a run, so a test clears the stores it relies on.

### React `memo` components

- Always pass a named function to `memo()` instead of an anonymous arrow function (e.g. `memo(function MyComponent() { ... })` not `memo(() => { ... })`).
- This ensures memoized components are identifiable in React DevTools and error stack traces without needing a separate `displayName` assignment.

### MUI: prefer `styled` over `sx` and keep the underlying component name

- For non-trivial styling, prefer extracting a named `styled(Component)` declaration over inlining `sx={{ ... }}` in JSX. Reserve `sx` for one-off, dynamic, or prop-driven styles where extracting would obscure intent.
- Always include the underlying component's name as a suffix in the styled component's name so the underlying element is obvious at a glance: e.g. `styled(DialogContent)` → `HeaderDialogContent` (not `HeaderContent`), `styled(Stack)` → `ActionsStack` (not `ActionsRow`), `styled(Typography)` → `WarningTypography`.
- Place styled declarations near the top of the file (after imports) so they're easy to scan.
- When `styled(Component)` strips a polymorphic prop (most commonly `Typography`'s `component`), cast the result back to `typeof Component` and add a one-line comment explaining the cast — see the `as` rule above.
- Rationale: named styled components show up as themselves in React DevTools, eliminate repeated inline blocks, and let readers understand the rendered DOM without crawling through `sx` props.

### Landing: `styled` and server components

- `apps/landing` renders static content as server components. `styled()` only runs in client modules there: MUI's `styled` is `"use client"`, and emotion reads the theme from React context.
- Keep a content component on the server and put its styled declarations in a sibling `X.styled.tsx` that starts with `"use client"`. Mark the component itself `"use client"` only when it needs interactivity, or when it only renders its props (`SectionHeading`).
- From a server component, `sx` takes plain values only (no `theme => …` callbacks), and MUI's `component` prop takes `NextLink` from `features/common/NextLink` instead of `next/link`.

### Docs: `apps/docs`

- The user, self-hosting and development docs are the Markdown in `apps/docs/src/content/docs/`, built with Starlight and published to docs.oboku.me. Update them in the same change as the behaviour they document.
- A page's title is its `title` frontmatter, and the body starts at `##`. A new page needs an entry in the `sidebar` of `apps/docs/astro.config.ts`.
- Link another page by its path on the site (`/guides/directives`), not by its file. The build fails on a broken internal link or anchor.
- A heading that ends in `{ #id }` keeps the anchor the GitBook site gave it, which published links point to. Keep the `{ #id }` when you reword the heading.
- A published URL stays valid: when a page moves or is renamed, add a permanent redirect from its old path to `redirects` in `apps/docs/vercel.json`.

### React components: do not use `FC`

- Never use `React.FC`, `FC`, or `FunctionComponent` to type components. Treat that pattern as deprecated and do not add it in new code.
- Prefer explicit props types on the function instead, e.g. `function MyComponent(props: MyProps) { ... }` or `function MyComponent({ a, b }: MyProps) { ... }`, and rely on inferred return types (or annotate the return only when it genuinely helps).
- Rationale: `FC` is discouraged by current React and TypeScript practice (including implicit `children`, weaker inference, and unnecessary indirection).

### Decision rule

- Default choice: the solution that best matches current repository patterns and reduces long-term fragmentation.
