# Consolidation audit — `oboku` monorepo

Scope: all packages in `oboku` (apps/web, apps/api, apps/admin, apps/landing, packages/shared, packages/synology).

This report flags concrete, small-scope consolidation opportunities. It is meant
to be acted on incrementally without large rewrites. A first batch of safe
fixes from this report is shipped on the same branch (see commits at the end).

Findings are grouped by category. Each item lists the relevant file(s) and
points out the lowest-risk consolidation path.

---

## 1. Duplicated logic

### 1.1 OneDrive `fetchOneDriveJson` wrappers — **fixed in this PR**
- `apps/web/src/plugins/one-drive/graph/index.ts:54-56` and
  `apps/api/src/features/plugins/one-drive/graph.ts:8-10` each defined a
  `fetchOneDriveJson<T>` that simply delegated to `fetchMicrosoftGraphJson`
  from `@oboku/shared`. Both wrappers were dropped and call sites now use
  the shared helper directly.

### 1.2 OneDrive "missing download URL" check — duplicate logic across web/api
- `apps/web/.../one-drive/graph/index.ts:118-123` (`getOneDriveDownloadInfo$`)
- `apps/api/.../one-drive/graph.ts:43-47` (`downloadOneDriveDriveItem`)
Both throw the same `Error("OneDrive did not return a download URL.")` after
checking `item["@microsoft.graph.downloadUrl"]`. Promote a small helper to
`packages/shared/src/microsoft/graph.ts`, e.g.
`getMicrosoftGraphDownloadUrl(item: GraphDriveItem): string` that throws an
`ObokuSharedError(ERROR_RESOURCE_NOT_REACHABLE, …)` from one place. Both
sides become a one-liner.

### 1.3 Notification mutation scaffold (web)
- `apps/web/src/notifications/inbox/useMarkNotificationAsSeen.ts`
- `apps/web/src/notifications/inbox/useMarkAllNotificationsAsSeen.ts`
- `apps/web/src/notifications/inbox/useArchiveNotification.ts`
All three repeat the same `mutationKey + networkMode: "online" +
cancelAndSnapshotNotificationQueries → setQueryData → rollback → invalidate`
shape. A tiny `createNotificationMutationOptions(queryClient, { mutationKey,
mutationFn, applyToList, applyToCount })` factory in
`apps/web/src/notifications/inbox/queryKeys.ts` (where the snapshot/rollback
helpers already live) would eliminate the three near-identical copies.

### 1.4 Tag/collection book mutations (web)
`apps/web/src/books/helpers.ts:14-103` defines four hooks that pair
`$pullAll` / `$push` (or `$addToSet`) updates on book/collection. The two
collection hooks (`useAddCollectionToBook`, `useRemoveCollectionFromBook`,
36-103) are essentially mirrored RxJS `merge` of two incremental updates
where only the operator differs. Consider a single
`useUpdateBookCollection(operator: "add" | "remove")` returning the same
shape — half the code, single test surface.

### 1.5 `sortByTitleComparator` callers
- `apps/web/src/search/useBooksForSearch.ts:42-46`
- `apps/web/src/books/helpers.ts:186-191` (`sortBooksBy`)
Both implement the same alphabetical-by-metadata-title sort. The latter is
already the canonical implementation; replace the inline sort in
`useBooksForSearch.ts` with `sortBooksBy(books, "alpha")`.

### 1.6 Two `isShallowEqual` sources
- `apps/web/src/workers/useRegisterServiceWorker.ts:15` imports it from
  `@oboku/shared`.
- `apps/web/src/reader/progress/useSyncBookProgress.ts:20` imports the same
  named export from `@prose-reader/core`.
Pick one (the shared one is already the project default — `apps/api` also
uses it) and use it everywhere in apps/web.

### 1.7 `book.post` defaults vs `createBook` (couch)
- `apps/web/src/books/helpers.ts:128-143` (`useAddBook`)
- `apps/api/src/lib/couch/dbHelpers.ts:187-208` (`createBook`)
Both materialize the "empty book" defaults (`readingStateCurrentState`,
progress fields, `tags: []`, `collections: []`, `createdAt: …`). A shared
factory `createDefaultBookFields()` in `@oboku/shared` (no UI strings, just
data) keeps web and api in lockstep when fields are added.

---

## 2. Pattern drift

### 2.1 Hook naming
- `useGetIsPluginEnabled` / `useGetIsPluginVisible`
  (`apps/web/src/plugins/useIsPluginEnabled.ts:26-30`) vs
  `useRequestFilesAccess` (google) / `useRequestItemsAccess` (one-drive).
The `useGet*` prefix is used in only this one place. Prefer
`useIsPluginEnabled` / `useIsPluginVisible` to match the rest of the codebase.

### 2.2 RxJS-`useQuery$` vs TanStack `useQuery`
- Books / collections still use reactjrx `useQuery$` / `useMutation$`
  (`apps/web/src/books/states.ts`, `collections/useCollection.ts`,
  `books/helpers.ts`).
- Notifications use vanilla TanStack Query.
This is the single biggest source of pattern drift in the web app. Not a
quick fix, but the recommendation per AGENTS.md is to extend the existing
TanStack pattern when adding new features and not introduce new
`useMutation$` call sites.

### 2.3 React `FC` usage — **partially fixed in this PR**
`apps/web/src/books/lists/ReadingProgress.tsx` was the last file using
`React.FC` (against the AGENTS.md rule). Migrated to a function declaration
with explicit props type. A repo-wide grep confirms no other production code
imports `FC` from `react`.

### 2.4 OneDrive integration split (web vs api)
The OneDrive plugin has parallel folders (`apps/web/.../one-drive/graph/`
and `apps/api/.../one-drive/`) with mirrored helpers, errors and types.
Most of the typed primitives already live in
`packages/shared/src/microsoft/graph.ts`. The remaining wrappers should
either move there or import from there directly (commit 1 already removed
the redundant `fetchOneDriveJson` wrappers).

### 2.5 Folder structure — `metadata` lives in two places
- `apps/web/src/metadata/*` — global metadata policy UI.
- `apps/web/src/books/metadata/*` — book-specific metadata UI.
The two trees mix policy and book metadata helpers. No urgency to merge,
but new code should pick one tree and stay there.

### 2.6 Error modeling
`apps/web/src/plugins/one-drive/graph/index.ts:102, 122` and
`apps/api/.../one-drive/graph.ts:46, 52, 56` throw raw `new Error(...)` for
"OneDrive did not return …" while the rest of the codebase uses
`ObokuSharedError` with a typed code. Consolidate to `ObokuSharedError` for
anything that can surface to the user.

---

## 3. Misplaced shared code

| Candidate | Current location | Why it could be shared |
|-----------|------------------|------------------------|
| Default book document factory | inline in `apps/web/src/books/helpers.ts:128-143` and `apps/api/src/lib/couch/dbHelpers.ts:187-208` | Pure object based on `BookDocType` only — perfect for `@oboku/shared`. Removes drift when fields are added. |
| `sortBooksBy` / `useBooksSortedBy` | `apps/web/src/books/helpers.ts:159-197` | Pure sort over `BookDocType` query results; safe to live in `@oboku/shared` (without the `useMemo` wrapper). |
| `getMetadataFromBook` / collection metadata accessor | `apps/web/src/books/metadata/index.ts`, `apps/web/src/collections/getCollectionComputedMetadata.ts` | Pure functions over `BookDocType` / `CollectionDocType`. Keeping them in app code means the api can't reuse the same merge order. |
| OneDrive download-URL guard | `apps/web/src/plugins/one-drive/graph/index.ts`, `apps/api/src/features/plugins/one-drive/graph.ts` | One-line helper next to `GraphDriveItem` in `packages/shared/src/microsoft/graph.ts`. |

Out of scope for this audit (would require larger refactors): consolidating
the apps/web `metadata/` and `books/metadata/` trees, and unifying RxJS
`useQuery$` with TanStack Query.

---

## 4. Unused / single-use abstractions — **partially fixed in this PR**

| Symbol | Location | Status |
|--------|----------|--------|
| `is` | `packages/shared/src/utils/objects.ts:7` | **Fixed:** demoted to module-local. Never imported anywhere. |
| `getFileNameFromContentDisposition`, `getFileNameFromUrl` | `packages/shared/src/utils/downloadFileName.ts:9, 31` | **Fixed:** demoted to module-local. Public API is `resolveDownloadFileName`. |
| `getUrlExtension` | `packages/shared/src/contentType.ts:1` | **Fixed:** demoted to module-local. Only used by `isFileSupported` in the same file. |
| `truncate` | `packages/shared/src/utils/truncate.ts` (re-exported via `index.ts`) | Single consumer in apps/web (`search/SearchScreenExpanded.tsx`). Could be inlined or kept; benefit is small. |
| `mergeWith` | `packages/shared/src/utils/mergeWith.ts` | Single consumer (`apps/web/src/collections/getCollectionComputedMetadata.ts`). Same trade-off. |
| `groupBy` | `packages/shared/src/utils/groupBy.ts` | Single consumer (`apps/web/src/problems/ProblemsScreen.tsx`). Same trade-off. |
| `differenceInMinutes` | `apps/web/src/common/date/differenceInMinutes.ts` | Single consumer (`CollectionActionsDrawer.tsx`). Inline or keep — small file but tiny indirection cost. |

The `truncate` / `mergeWith` / `groupBy` exports are arguably fine to keep
because they read like vetted lodash-style utilities consumers may pick up
in the future. Leaving them as-is.

---

## 5. TypeScript `as` assertion audit (top concerns)

Below is the high-impact subset of the full audit. Most assertions are at
RxDB boundaries (`rxdb/collections/*.ts`) and reducer accumulators
(`{} as Record<...>`). Lowest-effort wins are flagged with **★**.

| File:line | Assertion | Comment? | Suggested fix |
|-----------|-----------|----------|---------------|
| `apps/web/src/books/lists/ReadingProgress.tsx:22` | `ref as any` | No | **★ fixed in this PR** — typed `useMeasure<HTMLDivElement>()`. |
| `apps/web/src/pages/SearchScreen.tsx:126` | `inputRef as any` | No | Type the wrapper's `inputRef` prop to match the underlying `Input`. |
| `apps/web/src/tags/TagsSelector.tsx:19, 61` | `event.target.value as string[]`, `renderValue as any` | No | Use `Select<string[]>` generic + properly typed `renderValue` callback. |
| `apps/web/src/errors/ErrorMessage.tsx:84, 86` | `error as ObokuErrorCode` (twice) | No | Add `function isObokuErrorCode(s: string): s is ObokuErrorCode` and narrow once. |
| `apps/web/src/connectors/useAddConnector.ts:22` | `as Omit<SettingsConnectorDocType, "id">` | No | Narrow `postConnector` input type so the spread is inferred. |
| `apps/web/src/config/configuration.ts:10` | `JSON.parse(config) as Partial<GetWebConfigResponse>` | No | Use `zod` (already used elsewhere) to parse the bootstrap config. |
| `apps/web/src/common/dialogs/createDialog.ts:34, 45` | `return data as Result` (twice) | No | Tie `onConfirm`'s parameter to the `Result` generic. |
| `apps/web/src/common/lists/VirtuosoList.tsx:135` | `ref as Ref<HTMLDivElement>` | No | Type the wrapper's `GridItemProps.ref`. |
| `apps/web/src/library/shelves/filters/ReadingStateFilterDialog.tsx:33, 46` | `as ReadingState[]`, `event.target.value as ReadingState` | No | Narrow with a typed `radioValue` map; or `as const satisfies readonly ReadingState[]`. |
| `apps/web/src/pages/SettingsScreen.tsx:141, 173, 205` | `Object.keys(...) as LocalSettings[…][]` | No | Replace with a `keyof` map (`as const satisfies` pattern). |
| `apps/web/src/rxdb/collections/{book,collection,dataSource,link,settings,tags}.ts` | `{ ...json } as XDocType` | No | These are at the RxDB insert boundary; lower priority but `satisfies` would catch field drift better than `as`. |
| `apps/web/src/{download/states,tags/helpers,collections/CollectionsSelectionDialog,tags/TagsSelectionDialog}.ts` | `{} as Record<…>` reducer seeds | No | Annotate `reduce`'s generic instead: `reduce<Record<…>>((acc, …) => …, {})`. |
| `apps/web/src/plugins/synology-drive/download/client.ts:15` | `JSON.parse(...) as { error?: … }` | No | Add a `zod`/runtime check; the rest of the synology client already validates similar shapes elsewhere. |
| `apps/api/src/lib/utils.ts:111` | `fn(...(args as any))` | No | Type the throttled wrapper as `<F extends (…args: any[]) => any>(fn: F) => F`. |
| `apps/api/src/lib/couch/dbHelpers.ts:139` | `db.insert(finalData as any)` | No | Tighten `nano` insert generic / wrap in helper. |
| `apps/api/src/lib/couch/findTags.ts:16` | `…(query?.selector as any)` | No | Widen `SafeMangoQuery['selector']` rather than asserting at the call site. |
| `apps/api/src/features/plugins/helpers.ts:92, 96` | `dataSource as DataSourceDocType`; `return data as any` | Partial | Linked to `packages/shared/src/dataSources/index.ts:29` (`data_v2 as any`); fixing requires reshaping the discriminated union. |
| `packages/shared/src/utils/intersection.ts:5` | `as Array<Array<T>>` | No | `arrays.filter((arr): arr is Array<T> => arr != null)` removes the cast. |

Annotated assertions (already documented and reasonable to keep):
- `apps/web/src/connectors/TestConnection.tsx:93`
- `apps/web/src/common/selection/EntitySelectionView.tsx:169`
- `apps/web/src/plugins/common/DataSourceFormLayout.tsx:56, 63, 79`
- `apps/web/src/plugins/dropbox/lib/auth.ts:124`

Skipped: `as const`, import/export aliases, test files.

---

## 6. MUI `sx` → dedicated layout props (apps/web)

Top simplifications. Most are "convert single-property `sx` to a system prop
on the same component" or "switch `Box`+sx to a `Stack` with the matching
direction/alignment props".

| File:line | Current `sx` | Suggested |
|-----------|--------------|-----------|
| `common/lists/EmptyList.tsx:54` | `{ width: "100%" }` | `width="100%"` on the `Box`. |
| `connectors/TestConnection.tsx:58, 193` | `{ alignSelf: "stretch" }`, `{ alignSelf: "center" }` | Wrap in a `Stack` and set alignment there. |
| `common/selection/SelectionToolbar.tsx:62, 68-73, 80-84` | mixed flex sx | Replace inner `Box` with `Stack direction="row" alignItems="center" gap={1}`. |
| `common/FileTreeView/TreeView.tsx:93-99` | `{ display: "flex", alignItems: "center" }`, `{ mr: 1 }` | `Stack direction="row" alignItems="center"` + parent `spacing`. |
| `books/details/MetadataPane.tsx:16-25, 39` | layout sx + `bgcolor` | `Stack spacing={2}` / `Stack direction="row" spacing={2}`; `Box bgcolor="background.paper" width="100%"`. |
| `books/lists/BookListItemHorizontal.tsx:109, 322` | `{ display: "block" }`, `{ mt: "auto" }` | `display="block"` / `mt="auto"` (Box system props). |
| `books/lists/ReadingProgress.tsx:29-31` | `{ position: "relative" }` | (Note: `Box` does not currently expose `position` as a system prop in this MUI setup, so `sx` is fine here.) |
| `books/BookCoverCard.tsx:232` | `{ display: "block" }` | `display="block"` on the `Box`. |
| `auth/DeleteAccountDialog.tsx:56, 60-62, 77-80` | `{ color: "error.main" }`, `{ mt: 2 }`, `{ mt: 1 }` | `color="error"` on `DialogContentText`; parent `Stack spacing` for vertical rhythm. |
| `plugins/synology-drive/InfoScreen.tsx:97` | `{ px: 2, pt: 2 }` | `px={2} pt={2}` on the wrapping `Stack`. |
| `pages/books/$id/{collections,tags}/*.tsx`, `pages/collections/$id/books/*.tsx`, `pages/library/tags/$id/books/*.tsx` | `{ overflow: "hidden" }` | `Page` already spreads `StackProps` — pass `overflow="hidden"` directly. |
| `secrets/SetupSecretDialog.tsx:177` | `{ mt: 1 }` | Use `Stack spacing` or `TextField margin="normal"`. |
| `navigation/TopBarNavigation.tsx:88, 94-97` | `{ mr: 1 }`, `{ flexGrow: 1, overflow: "hidden" }` | `mr={1}` / `flexGrow={1} overflow="hidden"`. |
| `library/books/Toolbar.tsx:64` | `{ ml: 2 }` | `ml={2}`. |
| `problems/ProblemsScreen.tsx:98-101` | `{ overflow: "auto", flex: 1 }` | `overflow="auto" flex={1}` on the `Box`/`Stack`. |
| `collections/lists/CollectionListItemProgress.tsx:15-26` | full positional sx | Most maps to `Box` props (`position`, `top`, `left`, `width`, `height`, `m`); keep `bgcolor`/`opacity` if no prop maps cleanly. |

Borderline (recommend keeping `sx`):
- `reader/navigation/MoreDialog.tsx:148, 153` — `TabPanel` does not expose
  padding via prop.
- `notifications/inbox/cards/NotificationCardBase.tsx:30` — uses a child
  selector (`"& .MuiAlert-message"`).

Per AGENTS.md, the long-term direction here is `styled(Component)` with a
named declaration, not migrating sx→system props in place. For now, the
table above is the cheapest diff.

---

## 7. User-facing strings in shared packages

`packages/shared/src` does **not** contain typical user-facing copy
(localizable error messages, labels, placeholders) — that's in good shape.

Two notes that warrant a small follow-up:

1. **Marketing/external links live in shared**
   `packages/shared/src/index.ts:7-17` exports `links.documentation`,
   `links.app`, `links.site`, `links.linkedin`, `links.github`,
   `links.discord`, `links.reddit`. These are user-facing URLs (rendered in
   `apps/landing/...`, `apps/web/.../auth/AuthPage.tsx:55`,
   `apps/admin/.../AdminMicrosoftSection.tsx`, etc.). Per AGENTS.md, content
   strings should not live in shared. Recommend moving the `links` constant
   into either `apps/landing/src/config/links.ts` and re-importing it where
   needed, or duplicating it in each consuming app (web, admin, landing).
   Keep `design` in shared since it is design-system data, not copy.
2. **`MicrosoftGraphError` fallback message**
   `packages/shared/src/microsoft/graph.ts:67` falls back to
   `"Microsoft Graph request failed."` when neither the JSON payload nor
   `response.statusText` provide one. This *can* surface to a user via
   error reporting. Acceptable today (debugging-oriented), but if Graph
   errors ever bubble up to a UI toast, the user-friendly mapping should
   live in apps/web.

`packages/synology/src` has no user-facing strings.

---

## Changes shipped on this branch

The following safe, mechanical fixes are part of this PR (one commit each):

1. `refactor(one-drive): inline thin fetchOneDriveJson wrappers` — drops
   two duplicate wrappers and uses `fetchMicrosoftGraphJson` from
   `@oboku/shared` directly in both web and api.
2. `refactor(books): drop FC and ref cast in ReadingProgress` — replaces
   the last `React.FC` usage and removes a `ref as any` by typing
   `useMeasure<HTMLDivElement>()`.
3. `refactor(shared): unexport unused internal helpers` — demotes `is`,
   `getFileNameFromContentDisposition`, `getFileNameFromUrl`, and
   `getUrlExtension` from public exports to module-local helpers (no
   external consumers; verified by repository-wide grep).

The remaining items in this report are documented but intentionally not
applied here — they need either coordinated cross-file edits (notification
mutation factory, RxJS/`useQuery$` migration, sx→system prop sweep, `as`
fixes at RxDB boundaries) or a small API design decision (moving `links`
out of `@oboku/shared`, default book document factory) which is best done
in dedicated follow-ups.
