# Repository Consolidation Audit — `oboku`

Scope: `apps/web`, `apps/api`, `apps/admin`, `apps/landing`, `packages/shared`,
`packages/synology`.

Findings are ordered by impact (lines reduced × pattern-drift risk × ease).
Each row is small and incremental — no broad rewrites.

A first batch of safe fixes is already applied on this branch (see
**Applied in this PR** at the end).

---

## 1. Duplicated logic

### 1.1 [APPLIED] `bookActionDrawerSignal` / `useBookActionDrawer` duplicated in `secrets/SecretActionDrawer.tsx`

- `apps/web/src/secrets/SecretActionDrawer.tsx` (old lines 19–49)
- `apps/web/src/books/drawer/BookActionsDrawer.tsx` (lines 39–69)

Both files declared a `signal({ key: "bookActionDrawerState", … })` with the
**same key** and exported `bookActionDrawerSignal` / `useBookActionDrawer`.
The secrets copy was unused (no consumer imported it), but two `signal()`
declarations sharing one key is a latent state collision. **Fixed:** the
secret-side duplicates are removed and the component is converted to a named
`memo(function …)` per AGENTS.md.

### 1.2 [APPLIED] Six near-identical plugin `useLinkInfo.ts` files

| File | Body |
|---|---|
| `plugins/google/useLinkInfo.ts` | label = `ID: ${fileId}` |
| `plugins/dropbox/useLinkInfo.ts` | label = `ID: ${fileId}` |
| `plugins/one-drive/useLinkInfo.ts` | label = `ID: ${fileId}` (param order only diff) |
| `plugins/synology-drive/useLinkInfo.ts` | label = `ID: ${fileId}` |
| `plugins/server/useLinkInfo.ts` | label = `filePath` |
| `plugins/webdav/useLinkInfo.ts` | label = `filePath` |

**Fixed:** extracted `plugins/common/useFileIdLinkInfo.ts` and
`plugins/common/useFilePathLinkInfo.ts`; each plugin now `export { … as useLinkInfo }`.

### 1.3 [APPLIED] Dropbox `useSynchronize` & `useRefreshMetadata` build the same credentials object literal

`apps/web/src/plugins/dropbox/useSynchronize.ts` and `useRefreshMetadata.ts`
mapped a `DropboxAuth` instance to `providerCredentials` with the same fields
(`accessToken`, `accessTokenExpiresAt`, `clientId`, `codeVerifier`,
`refreshToken`) — the field order even differed between them, which means a
new credential field can silently land in only one of the two flows.

**Fixed:** added `plugins/dropbox/lib/credentials.ts` →
`mapDropboxAuthToProviderCredentials(auth)`, used by both hooks.

### 1.4 RxDB “find one + incremental \*” mutations (4 hooks)

- `apps/web/src/books/useIncrementalBookUpdate.ts`
- `apps/web/src/books/useIncrementalBookPatch.ts`
- `apps/web/src/books/useIncrementalBookModify.ts`
- `apps/web/src/collections/useCollectionIncrementalUpdate.ts`

All are the same pipe: resolve `doc` (string id → `findOne(...).exec()`, else
`of(doc)`) then `incrementalUpdate | incrementalPatch | incrementalModify`.

**Suggested:** add `common/rxdb/useIncrementalRxDocumentMutation.ts` taking
`(collection, op)` and have the four files re-export with a fixed collection
binding. Net deletion ~80 lines. Not applied because it changes more files
and has higher review surface.

### 1.5 Search hooks share a regex/sort/map pipeline

`apps/web/src/search/useBooksForSearch.ts` and
`apps/web/src/search/useCollectionsForSearch.ts` both:

```ts
const safe = search.replace(REGEXP_SPECIAL_CHAR, `\\$&`)
const re = new RegExp(safe, "i")
…
.sort((a, b) => sortByTitleComparator(titleA, titleB))
.map((item) => item._id)
```

**Suggested:** `search/buildSearchRegex.ts` + `search/useSearchListFilter.ts`
parameterized by `getSearchableText`. Small, can be done in isolation.

### 1.6 Notification mutation scaffolding repeats 3×

`useMarkNotificationAsSeen.ts`, `useMarkAllNotificationsAsSeen.ts`,
`useArchiveNotification.ts` (in `apps/web/src/notifications/inbox/`) all
share `mutationKey + cancelAndSnapshot → setQueryData → onError rollback →
onSettled invalidate`. **Suggested:** factory
`createNotificationMutationOptions({ mutationKey, mutationFn, applyOptimistic })`.

### 1.7 “Dangling refs” reducers

`useFixableBooks.ts` and `useFixableCollections.ts` (in
`apps/web/src/problems/`) implement the same `reduce → difference(refs, validIds)`
shape with two different generic `as` casts. **Suggested:** one
`collectDangling<T>(docs, getRefs, validIds)` helper.

### 1.8 `helpers.ts` in `books/` — book ↔ collection / book ↔ tag pairs

`useAddCollectionToBook` / `useRemoveCollectionFromBook` and
`useAddTagToBook` / `useRemoveTagFromBook` (`apps/web/src/books/helpers.ts`)
are mirror operations differing only by `$addToSet`/`$pullAll` or
`$push`/`$pullAll`. **Suggested:** a single internal helper per pair.

---

## 2. Pattern drift

### 2.1 RxDB writes: `useMutation$` (RxJS, books) vs `useMutation` (TanStack, collections)

- `books/useIncrementalBookModify.ts` uses `useMutation$` from `reactjrx` with
  `from()/mergeMap()`.
- `collections/useCollectionIncrementalModify.ts` uses `useMutation` from
  `@tanstack/react-query` with raw `async`/`await`.

Same conceptual operation against RxDB. **Recommend** standardizing on
`useMutation$` for RxDB-backed writes (matches books, secrets, dataSources).

### 2.2 Entity query hooks live in inconsistent files

| Domain | File |
|---|---|
| books | `books/states.ts` (`useBook`, `useBooks`, …) |
| collections | `collections/useCollection.ts`, `useCollections.ts` |
| tags | `tags/helpers.ts` (`useTag`, `useTags`, `useTagIds`) |

`helpers.ts` as the home for primary `use*` hooks is the outlier. **Recommend:**
move tag hooks to `tags/states.ts` (or split into `useTag.ts` etc.) so all
three domains follow the same convention.

### 2.3 Drawer “open” state: `signal` vs lifted `useState`

- Books / collections action drawers use a module-level `signal` + opener hook
  (multi-call-site).
- Tags drawer is opened by `useState` in `pages/library/LibraryTagsScreen.tsx`
  and prop-drilled to `tags/TagActionsDrawer.tsx`.

**Recommend:** align on the `signal` pattern when the drawer is openable from
multiple places.

### 2.4 Single-field create/rename dialogs: RHF vs `useState`

- `tags/AddTagDialog.tsx` → `react-hook-form` + `Controller` +
  `errorToHelperText` + `CancelButton`.
- `library/shelves/AddCollectionDialog.tsx`, `collections/.../RenameCollectionDialog.tsx`,
  inline `EditTagDialog` in `tags/TagActionsDrawer.tsx` → raw `useState` + `TextField`.

**Recommend:** standardize on RHF + `common/forms/` primitives for any dialog
that has a submit/validation step.

### 2.5 Mutation shape: `useUpdateTag` is a bare `useCallback`

`tags/helpers.ts` exports `useCreateTag` (`useMutation`) **and** `useUpdateTag`
(`useCallback` returning a Promise). Make `useUpdateTag` a proper
`useMutation`/`useMutation$` so loading/error UX is uniform.

### 2.6 Dialog open API: signal-opened vs prop `openWith`

`AddTagDialog` / `AddCollectionDialog` use module-level `signal` openers,
whereas `RenameCollectionDialog` is controlled by `openWith` prop from
`CollectionActionsDrawer` `useState`. Pick one per dialog category.

### 2.7 Feature folder shape varies

`books/`, `library/` use deep subfolders (`lists/`, `details/`, `drawer/`,
`shelves/filters/`); `home/`, `settings/`, `tags/` are mostly flat. Not urgent;
worth establishing one shallow convention so new features don’t branch into a
third style.

---

## 3. Misplaced shared code (web ↔ api)

### 3.1 [APPLIED] `isJsonContentType` (Synology Drive)

Defined identically at:

- `apps/web/src/plugins/synology-drive/download/client.ts` (line 11)
- `apps/api/src/features/plugins/synology-drive/client.ts` (line 270)

**Fixed:** promoted to `packages/synology/src/client.ts` as
`isSynologyDriveJsonContentType` (next to `parseSynologyDriveDownloadErrorPayload`).
Both apps now import it.

### 3.2 Synology Drive `requestJson` — same retry/404 orchestration on two HTTP stacks

- Web: `apps/web/src/plugins/synology-drive/client.ts` (`requestJson`)
- API: `apps/api/src/features/plugins/synology-drive/client.ts` (`requestJson`)

Same control flow (`buildApiUrls` → loop → JSON parse with caller-supplied
`parse` → retry on 404 → aggregate `lastError` → throw). Web uses `fetch`,
API uses `axios` + `getHttpsAgent`.

**Recommend:** move to `@oboku/synology` as `runSynologyDriveJsonRequest`
that takes a `getJson(url): Promise<unknown>` transport, leaving the small
HTTP adapters in each app. Larger but high-value: it’s the single point
where Synology API quirks (URL fanout, 404 retry) need to stay aligned.

### 3.3 Web download error handling already has a shared parser — just use it

`apps/web/src/plugins/synology-drive/download/client.ts#extractDownloadError`
does an untyped `JSON.parse(...) as { error?: { code? }; success? }`. The API
side already uses `parseSynologyDriveDownloadErrorPayload` from
`@oboku/synology`. **Recommend:** swap `JSON.parse` for the shared parser;
keep the human error message in the app per the shared-package content rule.

### 3.4 `fetchOneDriveJson` thin wrapper duplicated in both apps

- `apps/web/src/plugins/one-drive/graph/index.ts` (lines 54–56)
- `apps/api/src/features/plugins/one-drive/graph.ts` (lines 8–10)

Both just delegate to `fetchMicrosoftGraphJson<T>(accessToken, url)` from
`@oboku/shared`. **Recommend:** delete the wrappers and call the shared
function directly (or alias it once inside `packages/shared/src/microsoft/graph.ts`).

---

## 4. Unused / single-use abstractions

- `bookActionDrawerSignal` / `useBookActionDrawer` re-exports in
  `secrets/SecretActionDrawer.tsx` — **fixed in this PR** (were dead and
  collided with the real signal).
- `useUpdateTag` (`tags/helpers.ts`) — only used in two places, returns a raw
  promise. Either delete and inline, or upgrade to a real `useMutation` (see 2.5).
- The two “refresh metadata” + “synchronize” wrapper hooks per provider are
  intentional plugin contract surface (`ObokuPlugin<T>['useRefreshMetadata']`),
  so they’re not single-use indirection — they’re plugin glue.

A repo-wide “unused export” pass with `ts-prune` would surface more candidates
but should be a separate audit run.

---

## 5. TypeScript `as` assertion audit

**Estimated counts** (heuristic; an AST-based ESLint rule on `TSAsExpression`
nodes is recommended for an exact inventory):

| Directory | meaningful `as` | without comment | likely replaceable |
|---|---:|---:|---:|
| `apps/web/src/` | ~76 | ~55–60 | ~35–45 |
| `apps/api/src/` | ~42 | ~32–36 | ~22–28 |
| `packages/shared/src/` | ~4 | ~2 | ~2–3 |

**Top concrete offenders to address (no comment + clearly replaceable):**

1. `apps/web/src/books/lists/ReadingProgress.tsx:22` — `ref={ref as any}`
2. `apps/web/src/pages/SearchScreen.tsx:126` — `inputRef={inputRef as any}`
3. `apps/web/src/tags/TagsSelector.tsx:19,61` —
   `event.target.value as string[]`, `renderValue as any`
4. `apps/web/src/http/httpClient.shared.ts:132,149,162` — three
   post-interceptor `as HttpClientResponse<…>` returns; can be replaced by a
   discriminated branch type.
5. `apps/web/src/common/dialogs/createDialog.ts:34,45` — `data as Result`
   in `onConfirm`/action callbacks; align `DialogType<Result>` callback
   signatures (`Result | undefined`).
6. Several `{} as Record<…>` reducer seeds across
   `collections/CollectionsSelectionDialog.tsx`,
   `tags/TagsSelectionDialog.tsx`, `tags/helpers.ts`, `download/states.ts`,
   `pages/SettingsScreen.tsx` — all replaceable by a typed `reduce`
   generic, `Object.fromEntries`, or a tiny `typedKeys` helper.
7. `apps/web/src/problems/ProblemsScreen.tsx:91` —
   `as [string, { name: string; number: number }][]` from a `.map`; replace
   with `satisfies` or an explicit callback return type.

**`packages/shared/src/` (small but easy wins):**

- `metadata/index.ts` — `(BOOK_METADATA_SOURCES as ReadonlyArray<string>).includes(value)`
  twice. Replaceable by `as const satisfies readonly string[]` + a typed
  `isMember` helper that narrows the union.
- `utils/intersection.ts` — `filter(...) as Array<Array<T>>`. Replace via a
  user-defined type guard predicate so `filter` preserves `Array<T>[]`.
- `dataSources/index.ts` — `return dataSource.data_v2 as any` is documented
  (Extract-distribution limitation). OK.

Many “justified” assertions (RxDB inserts, HTTP intercept branches, SDK gaps)
still lack the AGENTS.md-required nearby comment. A focused commentary pass
without changing semantics would close the documentation gap.

---

## 6. MUI `sx` → shorthand layout/style props (oboku/web only)

These are clear, single-prop `sx` uses that have a direct shorthand on the
underlying MUI component (`Stack`, `Box`, `Button`, `Typography`, `IconButton`,
`Alert`, `DialogContentText`, `TabPanel`):

| File | Line | Current | Suggested |
|---|---|---|---|
| `connectors/ConnectorManagementButtons.tsx` | 34 | `<Stack direction="row" sx={{ gap: 1 }}>` | `gap={1}` |
| `connectors/TestConnection.tsx` | 56 | `<Alert sx={{ alignSelf: "stretch" }}>` | `alignSelf="stretch"` |
| `connectors/TestConnection.tsx` | 193 | `<Button sx={{ alignSelf: "center" }}>` | `alignSelf="center"` |
| `connectors/ConnectorForm.tsx` | 167, 203 | `<Stack sx={{ gap: 0.5 }}>`, `<Stack sx={{ gap: 1, mt: 4 }}>` | `gap={…} mt={…}` |
| `auth/CompleteSignUpForm.tsx` | 28 | `<Stack sx={{ gap: 1 }}>` | `gap={1}` |
| `auth/SignInForm.tsx` | 27 | same | `gap={1}` |
| `auth/SignUpForm.tsx` | 26 | same | `gap={1}` |
| `auth/SignOutBeforeContinuePage.tsx` | 11 | `<Stack sx={{ gap: 2 }}>` | `gap={2}` |
| `auth/DeleteAccountDialog.tsx` | 59, 76 | `<DialogContentText sx={{ mt: 2 / mt: 1 }}>` | `mt={…}` |
| `common/lists/EmptyList.tsx` | 54 | `<Box component="img" sx={{ width: "100%" }}>` | `width="100%"` |
| `common/selection/SelectionToolbar.tsx` | 62, 67 | `<IconButton sx={{ mr: 1 }}>`, `<Stack sx={{ flexGrow: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>` | `mr={1}`; `flexGrow={1} direction="row" alignItems="center" overflow="hidden"` |
| `common/lists/ListActionsToolbar.tsx` | 82 | `<Box sx={{ flexGrow: 1 }}>` | `flexGrow={1}` |
| `common/FileTreeView/TreeView.tsx` | 99 | `<LabelIcon sx={{ mr: 1 }} />` | `mr={1}` |
| `library/books/Toolbar.tsx` | 42, 64 | `<Stack sx={{ flexGrow: 1, justifyContent: "flex-start", flexDirection: "row", display: "flex", alignItems: "center" }}>`, `<Button sx={{ ml: 2 }}>` | unwind props; `display="flex"` redundant on `Stack` |
| `navigation/TopBarNavigation.tsx` | 90, 95 | `<IconButton sx={{ mr: 1 }}>`, `<Box sx={{ flexGrow: 1, overflow: "hidden" }}>` | `mr={1}`; `flexGrow={1} overflow="hidden"` |
| `books/BookCoverCard.tsx` | 232 | `<linkPlugin.Icon sx={{ display: "block" }} />` | `display="block"` |
| `books/lists/BookListItemHorizontal.tsx` | 109, 305, 319 | `sx={{ display: "block" }}`, `sx={{ display: "block" }}`, `sx={{ mt: "auto" }}` | shorthand |
| `secrets/SetupSecretDialog.tsx` | 165, 177 | `<Stack sx={{ gap: 2 }}>`, `<ControlledTextField sx={{ mt: 1 }}>` | `gap={2}`, `mt={1}` |
| `plugins/google/InfoScreen.tsx` | 69 | `<Stack sx={{ px: 2, alignItems: "flex-start" }}>` | `px={2} alignItems="flex-start"` |
| `plugins/dropbox/DataSourceForm.tsx` | 53 | `<Stack sx={{ gap: 1 }}>` | `gap={1}` |
| `plugins/synology-drive/InfoScreen.tsx` | 97 | `<Stack sx={{ px: 2, pt: 2 }}>` | `px={2} pt={2}` |
| `plugins/common/PickItemsSection.tsx` | 27 | `<Stack sx={{ gap: 1 }}>` | `gap={1}` |
| `upload/UploadConnectorSelectionStep.tsx` | 62 | `<Stack sx={{ gap: 2, py: 2 }}>` | `gap={2} py={2}` |
| `pages/sync/NewDataSourceScreen.tsx` | 48 | `<Stack sx={{ py: 2, gap: 2 }}>` | `py={2} gap={2}` |
| `notifications/inbox/NotificationsScreen.tsx` | 34 | `<Stack sx={{ p: 2, gap: 2 }}>` | `p={2} gap={2}` |
| `dataSources/reports/ReportSummary.tsx` | 12 | `<Stack sx={{ gap: 1 }}>` | `gap={1}` |
| `books/useRemoveHandler.tsx` | 34 | `<Stack sx={{ gap: 2 }}>` | `gap={2}` |
| `pages/library/tags/$id/books/TagBooksScreen.tsx` | 68 | `<Page sx={{ overflow: "hidden" }}>` | `overflow="hidden"` |
| `pages/books/$id/collections/BookCollectionsScreen.tsx` | 69 | same | `overflow="hidden"` |
| `pages/books/$id/tags/BookTagsScreen.tsx` | 62 | same | `overflow="hidden"` |
| `pages/collections/$id/books/CollectionBooksScreen.tsx` | 77 | same | `overflow="hidden"` |
| `reader/navigation/MoreDialog.tsx` | 148, 153 | `<TabPanel sx={{ padding: 0 }}>` | `p={0}` |

These are mechanical; can be done as a follow-up PR using a single commit.

---

## 7. User-facing strings in `packages/shared`

| File | Where | String | Verdict |
|---|---|---|---|
| `microsoft/graph.ts` | 64–67 | `"Microsoft Graph request failed."` fallback when JSON/`statusText` missing | **Definitely user-facing** — should be raised as a structured error with code; the human message belongs in the consuming app |
| `utils/formatBytes.ts` | 25–28 | `" B" / " KB" / " MB" / " GB"` | **Definitely user-facing** unit copy; the formatter is a presentation concern. Keep numeric bucketing in shared, move suffix formatting (or `Intl.NumberFormat`-based unit formatting) to the app |
| `utils/truncate.ts` | 5 | default `omission = "..."` | **Borderline** — the ellipsis is universal but is still presentation; consider making `omission` required so callers own it |
| `plugins/credentials.ts` | 83–86 | `` `Invalid ${type} provider credentials: …` `` (joined Zod issue messages) | **Borderline** — typically programmer-facing; if it ever surfaces in UI, raise with an error code instead and let the app render copy |
| `errors.ts#ObokuSharedError` | 56–58 | `super(previousError.message)` forwards upstream English | **Borderline** — no fixed string; behavior preserves whatever text upstream gives |
| `utils/assertNever.ts` | 2 | `` `Unexpected value: ${value}` `` | **Internal-only** (programmer assertion) — OK |

`microsoft/graph.test.ts` mocks (`message: "Item not found"`) and the
exported `links` map (URLs only) are **not** offenders.

**Recommend** the two clear cases (`graph.ts` fallback, `formatBytes` unit
suffixes) be moved or restructured per AGENTS.md.

---

## Applied in this PR

Each is a small, isolated change behind a separate commit:

1. `fix(secrets)` — remove duplicated `bookActionDrawer` signal/hook from
   `SecretActionDrawer.tsx` (key collision + dead exports). Component now uses
   `memo(function …)` per AGENTS.md.
2. `refactor(plugins)` — extract `useFileIdLinkInfo` and `useFilePathLinkInfo`
   under `plugins/common/`; six plugin `useLinkInfo.ts` files now re-export
   the relevant helper. Net deletion ≈ 60 lines.
3. `refactor(dropbox)` — extract `mapDropboxAuthToProviderCredentials`; both
   `useSynchronize` and `useRefreshMetadata` use it.
4. `refactor(synology)` — promote `isSynologyDriveJsonContentType` to
   `@oboku/synology`; remove the duplicated copies in
   `apps/web/.../download/client.ts` and `apps/api/.../synology-drive/client.ts`.

These are behavior-preserving and have no API changes outside one new export
on `@oboku/synology`.

## Suggested follow-ups (in rough priority order)

1. Mechanical `sx` → shorthand sweep for the 30+ spots in §6 (one PR, no
   review risk).
2. `useIncrementalRxDocumentMutation` consolidation (§1.4).
3. Standardize tag mutations on `useMutation` and move tag query hooks out of
   `tags/helpers.ts` (§2.2 + §2.5).
4. Replace `apps/web/.../download/client.ts#extractDownloadError`’s
   `JSON.parse(...) as …` with `parseSynologyDriveDownloadErrorPayload` (§3.3).
5. Delete `fetchOneDriveJson` web/api wrappers in favor of
   `fetchMicrosoftGraphJson` (§3.4).
6. Address the `as any` cluster in §5 starting with the four `ref={… as any}`
   sites and the `httpClient.shared.ts` interceptor returns.
7. Move `formatBytes` unit suffixes and `microsoft/graph.ts` fallback message
   out of `@oboku/shared` per the content-string rule.
