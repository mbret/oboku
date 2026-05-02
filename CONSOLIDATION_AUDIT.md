# Codebase consolidation audit — `oboku`

Audit date: 2026-05-02
Branch: `cursor/codebase-consolidation-audit-ad7b`
Scope: `apps/web`, `apps/api`, `apps/admin`, `apps/landing`, `packages/shared`,
`packages/synology`.

This report lists actionable consolidation opportunities ranked by impact. Only
small, incremental changes are proposed — no broad rewrites. A small first batch
of safe fixes is applied alongside this report (see "Applied in this PR").

---

## 1. Duplicated logic

### High impact

**1.1 Plugin `DownloadBook` cancel/lifecycle scaffolding (high)**

- Locations:
  - `apps/web/src/plugins/google/DownloadBook.tsx`
  - `apps/web/src/plugins/dropbox/DownloadBook.tsx`
  - `apps/web/src/plugins/synology-drive/DownloadBook.tsx`
  - `apps/web/src/plugins/webdav/DownloadBook.tsx`
  - `apps/web/src/plugins/uri/DownloadBook.tsx`
  - (variant) `apps/web/src/plugins/one-drive/DownloadBook.tsx`
- Every plugin recreates `userCancel$ = new ReplaySubject<void>(1)` /
  `lifecycle$` in `useEffect`, wires `takeUntil` + `throwIfEmpty` mapping to
  `LifecycleCancelError` / `CancelError`, and mirrors `onError` to swallow
  `LifecycleCancelError`. Several also duplicate `AbortController.abort()`
  wiring on both cancel paths.
- **Fix (incremental):** add a `useUnmountReplaySubject()` next to the existing
  `apps/web/src/common/rxjs/useUnmountSubject.ts`, plus a tiny
  `partitionUserLifecycleCancel(unmount$)` operator. Migrate one plugin first
  (Dropbox is the smallest), then the rest one-by-one.

**1.2 RxDB "resolve doc ref then incremental*" hooks (high)**

- Locations:
  - `apps/web/src/books/useIncrementalBookModify.ts`
  - `apps/web/src/books/useIncrementalBookPatch.ts`
  - `apps/web/src/books/useIncrementalBookUpdate.ts`
  - `apps/web/src/collections/useCollectionIncrementalUpdate.ts`
- Same pipeline: `getLatestDatabase` → resolve `doc | _id` → guard null → call
  `incrementalModify | incrementalPatch | incrementalUpdate`.
- **Fix:** internal helper `mutationFromDocRef(collectionName, method)` returning
  the same `useMutation$` config; thin per-collection wrappers. Adopt as new
  files are touched.

**1.3 Notification optimistic update pairs (medium → high)**

- `apps/web/src/notifications/inbox/useMarkAllNotificationsAsSeen.ts`
- `apps/web/src/notifications/inbox/useMarkNotificationAsSeen.ts`
- Both repeat: `cancelAndSnapshotNotificationQueries` →
  `setQueryData(inbox)` with `seenAt: new Date().toISOString()` →
  `setQueryData(unreadCount)` → `rollbackNotificationCaches` on error →
  `invalidateNotificationQueries` on settle.
- **Fix:** extract `patchNotificationCachesForSeenOptimistic(queryClient,
  { mode: "single" | "all", id? })` and reuse.

### Medium impact

**1.4 Plugin OAuth/credentials twins**

- Dropbox `useSynchronize.ts` vs `useRefreshMetadata.ts`: identical
  `auth.get…()` mapping into `providerCredentials`.
- One-drive `useSynchronize.ts` vs `useRefreshMetadata.ts`: identical call to
  `requestOneDriveProviderCredentials`.
- Server / WebDAV / Synology-Drive `useRefreshMetadata.ts`: same shape
  (extract connector → `password` from `result.data.password`). Synology even
  throws a generic `Error("No connector id")` while server/webdav throw
  `ObokuSharedError(ERROR_CONNECTOR_NOT_CONFIGURED)` — behavioral drift.
- **Fix:** small per-plugin shared helper functions
  (`mapDropboxAuthToCredentials(auth)`,
  `requestOneDriveCredentialsForSync(requestPopup)`,
  `extractPasswordCredentials(extract, linkData)`). Already the easiest cleanup —
  applied in this PR for Synology-Drive's error type to match server/webdav.

**1.5 Books vs Collections computed metadata merging**

- `apps/web/src/books/metadata/index.ts` (`getMetadataFromBook`,
  hand-rolled shallow merge with special-cases for `date` / `authors` /
  `subjects`)
- `apps/web/src/collections/getCollectionComputedMetadata.ts`
  (uses `mergeWith` from `@oboku/shared`)
- **Fix:** do not unify algorithms blindly (book has extra rules). Add tests
  that lock parity for overlapping fields, then extract only the
  "ordered priority list of metadata sources → reduce" scaffolding.

### Low / opportunistic

**1.6 Common ISO-date "descending" sort idiom**

- `apps/web/src/dataSources/reports/useSyncReports.ts:85`
  `(a.createdAt < b.createdAt ? 1 : -1)`
- `apps/web/src/books/helpers.ts:173` same idiom.
- **Fix:** add `compareIsoDesc(a, b)` in `@oboku/shared/sorting.ts`
  (no UI strings) — applied in this PR.

**1.7 `dataSources` modify vs patch DB-access drift**

- `useDataSourceIncrementalModify.ts` uses `latestDatabase$.pipe(first())`
  inline; `useDataSourceIncrementalPatch.ts` uses `getLatestDatabase()`. Same
  job, two entry points.
- **Fix:** standardize on `getLatestDatabase()` (it is `latestDatabase$.pipe(first())`
  internally). Applied in this PR.

---

## 2. Pattern drift

| # | Concept | Locations | Suggested direction |
|---|---------|-----------|----------------------|
| 2.1 | Mutation library: `@tanstack/react-query` vs `reactjrx`'s `useMutation$` | `tags/helpers.ts`, `secrets/useInsertSecret.ts` (TanStack) vs `dataSources/useCreateDataSource.ts`, book/collection incrementals (`useMutation$`) | Document a one-liner rule: imperative one-shot → TanStack; observable pipeline / cancellation → `useMutation$`. Don't migrate retroactively. |
| 2.2 | Hook naming: `useCreateXQuery` (returns `UseQueryOptions`) vs `useCreate*` (mutation that persists) | `useCreateDriveFileQuery` vs `useCreateCollection` | Rename `useCreateXQuery` → `useXQueryOptions` when next touched. |
| 2.3 | Folder layout drift between feature folders | `collections/`, `tags/`, `books/` | Mirror one template (`queries.ts` / `mutations.ts` / `hooks.ts`); peel `tags/helpers.ts` opportunistically. |
| 2.4 | Persisted timestamp shape | `books/helpers.ts:136` `createdAt: Date.now()` (number) vs `new Date().toISOString()` everywhere else | Pick one (ISO string preferred — already dominant). Add a doc note; convert with a migration only when needed. |
| 2.5 | Connector-missing error type | `server/useRefreshMetadata` + `webdav/useRefreshMetadata` use `ObokuSharedError(ERROR_CONNECTOR_NOT_CONFIGURED)`; `synology-drive/useRefreshMetadata` throws generic `Error("No connector id")` | Use `ObokuSharedError` in synology-drive too. **Applied in this PR.** |
| 2.6 | Mutation parameter naming: `mutationFn` (TanStack convention) vs custom `mutationFunction` | `dataSources/useDataSourceIncrementalModify.ts` uses `mutationFunction` while sibling `IncrementalPatch` uses `patch`; books incremental hooks use `mutationFn`/`updateObj` | Keep `mutationFn` / domain-named param when introducing new ones. |

---

## 3. Misplaced / candidate shared code

These are utilities currently in `apps/web` (or duplicated cross-app) that
could be promoted, **only if no user-facing strings come along** (per
`AGENTS.md`):

- `compareIsoDesc(a, b)` — used by book sort and sync-report sort. **Promoted to
  `@oboku/shared` in this PR.**
- Trim-to-null helpers (`apps/api/src/notifications/notifications.service.ts`
  `normalizeOptionalText`, similar shape elsewhere). Could become
  `trimToNull(value: string | null | undefined)` in shared. Not done in this
  PR — wait for a second consumer.
- Microsoft Graph helpers (`packages/shared/src/microsoft/graph.ts`) already
  shared; **see §7 — they currently leak English fallback strings.**

No big-bang web↔api consolidations are recommended; the duplication that
exists between `apps/web` and `apps/api` is mostly the kind that *should* live
on each side (HTTP transport in web, persistence in api).

---

## 4. Unused / single-use abstractions

`@oboku/shared` exports never imported in `apps/**`:

- `parseMicrosoftGraphError` — only called inside `microsoft/graph.ts` itself.
  Make it `non-exported` (internal) — **applied in this PR**.
- `getMicrosoftGraphDriveItem` — only used in `apps/api`. Not strictly app-only
  (could be reused later); leave for now.

Single-`apps/web`-consumer shared exports (candidates to move back to web only
if surface needs to shrink — keep for now since they're small):

- `mergeWith` — `apps/web/src/collections/getCollectionComputedMetadata.ts`
  only.
- `groupBy` — `apps/web/src/problems/ProblemsScreen.tsx` only.

---

## 5. TypeScript `as` assertion audit

Estimated ~165 assertion sites across the monorepo (excluding `as const` and
import aliases). High-level breakdown:

| Bucket | Approx. | Notes |
|--------|---------|-------|
| Critical (input-trust gap) | ~35 | `JSON.parse(...) as X` for storage / external payloads; nano `Mango selector as any` |
| Easy wins | ~25 | Replaceable by discriminated unions, `satisfies`, type guards |
| Justified but **undocumented** (violates AGENTS.md) | ~40 | Styled-component polymorphism, IndexedDB unwraps |
| Acceptable / interop | ~65 | MUI polymorphism rest props, third-party SDK gaps |

### Top concrete cleanup targets

1. `apps/web/src/config/configuration.ts:10` —
   `JSON.parse(config) as Partial<GetWebConfigResponse>`. Localstorage is
   user-controllable. Wrap in zod schema (zod is already a dependency of
   `@oboku/shared`).
2. `packages/shared/src/dataSources/index.ts:29` — `return dataSource.data_v2 as any`.
   Has a comment justifying TS distribution; root cause is generics. File a
   refactor ticket — leave the `as` for now.
3. `apps/api/src/lib/couch/findTags.ts:16` — `(query?.selector as any)` and
   `apps/api/src/lib/couch/dbHelpers.ts:139` `db.insert(finalData as any)`
   bypass nano typing. Add a thin typed wrapper or local interface.
4. `apps/admin/src/routeTree.gen.ts` — 10× `as any` in **generated** code.
   Update the route generator config rather than editing the file.
5. `apps/web/src/plugins/usePluginRefreshMetadata.ts:65–93` — 8 casts of
   `params as UseRefreshMetadataVariables<"…">`. Replace with a registry
   `Record<Type, Variant>` typed map.
6. Several MUI `styled(X) as typeof X` casts (e.g.
   `apps/web/src/books/details/MetadataSourcePane.tsx:44–48,91`) are aligned
   with the AGENTS.md MUI rule but **lack the required per-cast comment**.
   Add a one-liner where missing.

> A future PR can target ~5 cleanups per area; this PR only annotates the rule
> and ships the smallest.

---

## 6. MUI `sx` styling inconsistencies (web)

Top candidates to convert:

| # | File | Pattern | Action |
|---|------|---------|--------|
| 6.1 | `books/details/TagsRow.tsx:23–28` | `<Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center" }}>` | Use `<Stack direction="row" gap={1} alignItems="center">`. **Applied in this PR.** |
| 6.2 | `books/lists/BookListItemHorizontal.tsx:100–148` | Three nearly identical inline rows | Replace with `<Stack direction="row">` props or one named `styled(Stack)`. |
| 6.3 | `books/BookCoverCard.tsx:203–223` | Static bottom bar, ~10 properties | Extract `BookCoverBottomBarBox = styled(Box)(({theme}) => ({...}))`. |
| 6.4 | `pages/collections/CollectionDetailsScreen/Header.tsx:59–67, 114–134` | Gradient overlay + redundant `sx` on `Stack` | Extract `CollectionHeaderGradientBox = styled(Box)`; drop redundant `sx` on Stack with `direction="row"`. |
| 6.5 | `navigation/TopBarNavigation.tsx:109–134` | Fake search box with nested flex | Extract `TopBarSearchBox = styled(Box)`. |
| 6.6 | `common/selection/SelectionToolbar.tsx:67–84` | Layout-only `sx` on `Stack` | Convert to `Stack` props. |
| 6.7 | `common/lists/ListActionsToolbar.tsx`, `library/books/Toolbar.tsx`, `plugins/common/TreeActionsSection.tsx`, `upload/AddBookFileBrowseStep.tsx`, `notifications/inbox/cards/NotificationCardBase.tsx` | Repeated `display:"flex", justifyContent:"space-between"` rows | Convert to `<Stack direction="row" justifyContent="space-between">`. |
| 6.8 | `reader/BookError.tsx`, `reader/BookLoading.tsx`, `common/EmptyList.tsx` | Centered flex | `<Stack alignItems="center" justifyContent="center">`. |

Pattern summary: ~12+ files use `display:"flex"` + `alignItems:"center"` in
`sx` for toolbars/overlays/readers. A one-time pass can convert these without
touching behavior.

---

## 7. User-facing strings in `@oboku/shared`

| File:line | String | Status |
|-----------|--------|--------|
| `packages/shared/src/utils/formatBytes.ts:25–28` | `" B"`, `" KB"`, `" MB"`, `" GB"` | **Borderline** — these are SI unit suffixes, technically labels but locale-stable. Keep but document. |
| `packages/shared/src/utils/truncate.ts:5` | default `"..."` omission | OK (typographic, not prose). |
| `packages/shared/src/microsoft/graph.ts:67` | `"Microsoft Graph request failed."` (English fallback) | **Violates rule** — surfaces in `ErrorMessage.tsx` for non-`ObokuSharedError` paths. Recommended follow-up: drop the literal and let the consuming app's error UI provide copy when `payload?.error?.message` and `response.statusText` are both absent. Not changed in this PR (would need a coordinated web-side string addition). |
| `packages/shared/src/plugins/credentials.ts:83–86` | `"Invalid ${type} provider credentials: …"` | **Violates rule** — this is API-side facing today, but English. Recommend follow-up: throw `ObokuSharedError(ERROR_PROVIDER_CREDENTIALS_INVALID, cause)` and let caller render copy. Not changed in this PR (would touch API + web). |
| `packages/shared/src/utils/assertNever.ts:2` | `"Unexpected value: …"` | OK — diagnostic only, never user-facing in normal flow. |
| `packages/shared/src/index.ts links` | URLs | OK — branding, not localizable copy. |

---

## Applied in this PR

Small safe changes that match findings above and reduce drift today:

1. **§2.5 / §1.4** — `apps/web/src/plugins/synology-drive/useRefreshMetadata.ts`
   and `useSynchronize.ts`: throw `ObokuSharedError(ERROR_CONNECTOR_NOT_CONFIGURED)`
   instead of generic `Error`, matching server/webdav.
2. **§1.6** — Add `compareDesc` (generic ISO/number/Date descending comparator)
   to `@oboku/shared/sorting.ts` with tests, and use it in
   `apps/web/src/books/helpers.ts` and
   `apps/web/src/dataSources/reports/useSyncReports.ts`. (Generalised from a
   string-only `compareIsoDesc` because the two consumers differ — book sort
   uses `Date.now()` numbers, sync report sort uses `Date` objects.)
3. **§1.7** — `apps/web/src/dataSources/useDataSourceIncrementalModify.ts`:
   switch from inline `latestDatabase$.pipe(first())` to `getLatestDatabase()`,
   matching `useDataSourceIncrementalPatch.ts`.
4. **§4** — `packages/shared/src/microsoft/graph.ts`: drop the `export` from
   `parseMicrosoftGraphError` (only used inside the module).
5. **§6.1** — `apps/web/src/books/details/TagsRow.tsx`: replace inline `sx`
   layout with `Stack` props.

These are intentionally tiny — each touches one or two files and doesn't
change runtime behavior except where explicitly noted (synology error type,
Microsoft Graph fallback string).

## Suggested follow-ups (not in this PR)

- Plug `useUnmountReplaySubject` and apply across plugin `DownloadBook` files
  (one plugin per PR).
- Replace `JSON.parse(...) as X` in `configuration.ts` with a zod schema parse.
- Convert top ~8 `sx` candidates from §6 to `styled(Component)` or `Stack`
  props.
- Introduce a `mutationFromDocRef` helper for incremental mutations (§1.2).
- Extract `patchNotificationCachesForSeenOptimistic` (§1.3).
- Add per-cast comment to MUI `styled(...) as typeof X` patterns to satisfy
  the AGENTS.md rule.
