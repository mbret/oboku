# Oboku consolidation audit — 2026-05-04

Scope: `oboku` monorepo at `/workspace` (apps: `admin`, `api`, `landing`, `web`;
packages: `shared`, `synology`). Findings are ranked by impact and limited to
small, incremental changes per `AGENTS.md`.

---

## TL;DR

The repo is in a healthy state overall: shared utilities are factored out, naming is
mostly consistent, and string content stays in apps. The biggest leverage points are:

1. **One generic `useIncrementalRxDocMutation` hook** can replace the 5 copy-pasted
   document mutation hooks (`useIncrementalBookPatch/Modify/Update`,
   `useCollectionIncrementalModify/Update`).
2. **One `useApiQuery`/`useApiMutation` helper** in `apps/admin` can collapse
   ~12 nearly identical TanStack Query wrappers around `authenticatedFetch`.
3. **One `Rename<Entity>Dialog`** would replace `RenameCollectionDialog` and
   `EditTagDialog`, which are textbook duplicates.
4. **Drop `useCollectionIncrementalUpdate` and `useIncrementalBookUpdate`** as
   wrappers and call `incrementalUpdate` directly via the generic hook above.
5. A handful of MUI `sx` prop usages should switch to dedicated styled components
   (per AGENTS.md), and the rule against `React.FC` is broken in ~20 files.

A dead-code branch in `search/list/FiltersDrawer.tsx` (`getNotInterestedLabelFromValue`)
has been fixed in this PR as a freebie since it was a clear bug, not a refactor.

---

## 1. Duplicated logic

### 1.1 RxDB document-mutation hooks (high impact)

Five hooks have the exact same shape — fetch a doc by id (or accept a doc), then
forward an `incrementalPatch | incrementalModify | incrementalUpdate` call. They
each weigh ~25 lines of identical RxJS plumbing.

- `apps/web/src/books/useIncrementalBookPatch.ts`
- `apps/web/src/books/useIncrementalBookModify.ts`
- `apps/web/src/books/useIncrementalBookUpdate.ts`
- `apps/web/src/collections/useCollectionIncrementalModify.ts` (same shape, but uses
  `useDatabase()` + `useMutation` instead of `getLatestDatabase()` + `useMutation$`
  — drift)
- `apps/web/src/collections/useCollectionIncrementalUpdate.ts`

**Recommendation**: introduce one parameterised hook that accepts the collection
name and the operation, e.g.

```ts
export const useIncrementalRxDocMutation = <
  C extends keyof Database["collections"],
  Op extends "patch" | "modify" | "update",
>(collection: C, op: Op) => useMutation$({ ... })
```

…and have the existing hook names re-export thin specialised wrappers (or be
deleted in favour of inline call sites). Estimated reduction: ~110 LOC.

Also note `useCollectionIncrementalModify` is the odd one out — it uses
`useDatabase()` + `@tanstack/react-query`'s `useMutation`, while the four book
hooks use `getLatestDatabase()` + `reactjrx`'s `useMutation$`. Pattern drift.

### 1.2 Admin API query/mutation hooks (high impact)

`apps/admin/src/features/**` contains ~12 hooks that all follow the exact same
template:

```ts
const res = await authenticatedFetch(`${config.apiUrl}/...`, { ... })
if (!res.ok) throw new Error(res.statusText || "Could not …")
return res.json()
```

…optionally followed by a `notifications.show({ title, message, color })` block.
Affected files (non-exhaustive):

- `useCoverCleanupStats.ts`, `useDeleteAllCovers.ts`, `useGenerateSignUpLink.ts`,
  `useInstanceSettings.ts`, `useUpdateInstanceSettings.ts`,
  `useMigrateCollectionCoverKeys.ts`, `useMigrateResourceIdToLinkData.ts`,
  `useMigrateWebdavConnectors.ts`, `useMigrateWebdavResourceIds.ts`
- `notifications/useAdminNotifications.ts`,
  `notifications/useCreateAdminNotification.ts`
- `serverSources/useServerSources.ts`, `serverSources/useServerSync.ts`,
  `serverSources/useCreateServerSource.ts`,
  `serverSources/useDeleteServerSource.ts`,
  `serverSources/useUpdateServerSource.ts`

**Recommendation**: add two helpers in `apps/admin/src/features/api.ts`:

```ts
export const adminFetchJson = async <T>(path: string, init?: RequestInit, fallback?: string): Promise<T>
export const adminMutation = <Input, Output>(opts: { ... }) => useMutation(...)
```

The `readResponseErrorMessage` already exists and is used inconsistently (some
hooks use it, some use only `response.statusText`). Standardising on
`adminFetchJson` would also fix that inconsistency. Estimated reduction:
~150 LOC, plus consistent error messages.

The error message templates ("Could not load X", "Could not update X", etc.)
are also duplicated and could be derived from a single per-resource string.

### 1.3 Rename dialogs (medium impact)

`apps/web/src/collections/CollectionActionsDrawer/RenameCollectionDialog.tsx` and
the inner `EditTagDialog` inside `apps/web/src/tags/TagActionsDrawer.tsx` are
near-identical: both keep a `name` state synced from a hook, render a `<Dialog>`
with one `<TextField>` and Cancel/Save actions. The only differences are the
hook used to update and the title.

**Recommendation**: a generic `RenameDialog` in `common/dialogs/RenameDialog.tsx`
parameterised on `value`, `onSave`, `title`. Estimated reduction: ~70 LOC.

### 1.4 Search filters (low impact)

`useBooksForSearch.ts` and `useCollectionsForSearch.ts` share regex-escape +
title sort logic. They could share a small `buildSearchMatcher(search)` helper
that returns a predicate. ~15 LOC saved, but mostly readability.

### 1.5 Auth lock pattern (informational)

`apps/web/src/auth/useSignIn`, `useSignUp`, `useCompleteSignUp`,
`useRequestMagicLink`, `useCompleteMagicLink` all wrap an HTTP call with
`.pipe(withLock("…"))`. They're already small and use a consistent pattern, but
the `withLock` key strings (`"authentication"`, `"signup"`, `"signup-complete"`,
`"magic-link-request"`, `"magic-link-complete"`) live as inline magic strings
across files. Promote them to a `AUTH_LOCKS` const so a typo can't silently
unlock concurrent runs.

---

## 2. Pattern drift

### 2.1 `useMutation` vs `useMutation$` for RxDB writes

`useCollectionIncrementalModify` uses `@tanstack/react-query`'s `useMutation` +
`useDatabase()`, while every other RxDB write hook in `apps/web` uses
`reactjrx`'s `useMutation$` + `getLatestDatabase()`. This shows up as a divergent
RxDB write pattern within the same `collections/` folder.

Fix as part of §1.1.

### 2.2 Two parallel `useTags` query patterns

`apps/web/src/tags/helpers.ts` mixes a "module-level observable" pattern
(`tags$`, `protectedTags$`, `blurredTags$`) with `useTagsByIds` reducing inside
the query function. Most other read-side hooks in the repo (`useBooks`,
`useCollections`) lift everything into the `queryFn`. Either is fine, but the
file mixes both. Pick one (the module-level `tags$` is nicer since multiple
hooks share it).

Two functions in this file are explicitly `@deprecated move to observable` —
`getProtectedTags`, `getTagsByIds`. Worth checking call sites and removing.

### 2.3 `React.FC` / `: FC<…>` vs function-typed props

AGENTS.md explicitly forbids `React.FC` / `FC` / `FunctionComponent`. Currently
~18 files in `apps/web/src` still use the `FC<…>` shorthand:

- `common/OrDivider.tsx`
- `collections/lists/SelectableCollectionListItem.tsx`
- `collections/CollectionActionsDrawer/RenameCollectionDialog.tsx`
- `books/lists/ReadingProgress.tsx`, `books/lists/SortByDialog.tsx`,
  `books/BookCoverCard.tsx`
- `workers/UpdateAvailableDialog.tsx`
- `pages/profile/ProfileScreen.tsx`
- `tags/tagList/SelectableTagListItem.tsx`, `tags/TagActionsDrawer.tsx`,
  `tags/TagsSelector.tsx`
- `search/list/FiltersDrawer.tsx`
- `library/shelves/filters/FiltersDrawer.tsx`,
  `library/LibraryFiltersDrawer.tsx`
- `navigation/DialogTopBar.tsx`, `navigation/TopBarNavigation.tsx`
- `dataSources/DataSourcesAddDrawer.tsx`
- `plugins/types.ts` (uses `FC<…>` and `FunctionComponent<…>` for plugin slot
  types — these are property types, not component definitions, so check if the
  rule covers those).

This is purely a mechanical substitution — `FC<{ open: boolean }>` becomes
`function Foo({ open }: { open: boolean })`. Low risk, recommended as one
incremental sweep.

### 2.4 `connectorType` plumbing

`AddConnectorScreen.tsx` does a hand-rolled `switch (type)` over
`SettingsConnectorType` to pick a `ConnectorForm`, while a parallel pattern
exists for plugins (`pluginsByType`/`getPluginByType` in
`plugins/configure.tsx`). Connectors should follow the same registry pattern:
extend `CONNECTOR_DETAILS` (or a sibling `CONNECTORS_BY_TYPE`) so the form
component is part of the data, not switched on at the call site. Removes the
`getConnectorForm` helper and the explicit imports.

### 2.5 `inboxNotifications*` query keys vs `coverCleanupStatsQueryKey` location

Notification query keys live in a dedicated `queryKeys.ts`, while
`coverCleanupStatsQueryKey` and `serverSourcesQueryKey` are colocated in their
hook files and imported by sibling files. No strong reason for the divergence —
either consistently colocate or consistently extract per feature.

---

## 3. Misplaced shared code

The repo already has a healthy `@oboku/shared` boundary. A couple of small
candidates:

- `apps/api/src/lib/utils.ts::formatDuration` is similar in spirit to
  `@oboku/shared/utils/formatBytes`. It is currently API-only, but
  `apps/web/src/dataSources/reports/helpers.ts` defines a
  `formatReportDuration(start, end)` for the same purpose. If the API and web
  ever need consistent display, move to shared. Low priority.
- `apps/admin/src/features/readResponseErrorMessage.ts` is generic and could
  arguably move to `apps/admin`'s lib root or be reused by `apps/web` (which has
  its own `errors/ErrorMessage.tsx`). Today it is admin-only; leave as-is unless
  consolidating with web's error handling.

No clear cross-app duplication that cleanly belongs in `@oboku/shared` was
found — most of what looked duplicated is web-only or admin-only.

---

## 4. Unused / single-use abstractions

### 4.1 `useCollectionIncrementalUpdate` (single-call-site)

`useCollectionIncrementalUpdate` is only used by `useAddCollectionToBook` and
`useRemoveCollectionFromBook` in `books/helpers.ts`. If §1.1 generic hook lands,
delete this file.

### 4.2 `useIncrementalBookUpdate` (single-call-site)

Same situation: only used by `useAddCollectionToBook` and
`useRemoveCollectionFromBook`. Delete after §1.1.

### 4.3 `getProtectedTags`, `getTagsByIds` in `tags/helpers.ts`

Both flagged `@deprecated move to observable`. Confirm no callers and delete.

### 4.4 `apps/web/src/books/index.ts` barrel

Re-exports three sibling files. A barrel for three things with mixed import
sites adds indirection without value. Either remove and import directly, or
expand to cover the rest of `books/`.

### 4.5 `connectors/AddConnectorScreen.tsx::getConnectorForm`

Exported but only used in the same file (as `Form`). Inline or move into a
registry per §2.4.

---

## 5. TypeScript `as` audit

Total of `as` occurrences (TS) in the repo is moderate; most uses are legitimate
(`as const`, narrowing legacy storage, RxDB types). Highlights below — full
listings via `rg "\bas\s+\w+" -t ts -t tsx`.

### 5.1 `as any` / `as unknown as` (all already justified, mostly)

| File:line | Context | Comment? | Recommendation |
|---|---|---|---|
| `apps/web/src/connectors/TestConnection.tsx:93` | `extra as unknown as ConnectionExtraParams<D>` | No | Add comment explaining unsafe cast or guard via discriminant. |
| `apps/web/src/books/lists/ReadingProgress.tsx:22` | `ref={ref as any}` | No | `Ref<HTMLDivElement>` like `VirtuosoList.tsx` does. |
| `apps/web/src/common/selection/EntitySelectionView.tsx:169` | `}) as unknown as <T extends ListFilterItem>(` | No | Add justification comment — generic-component cast. |
| `packages/shared/src/dataSources/index.ts:29` | `return dataSource.data_v2 as any` | No | Tighten return type or document why. |
| `apps/api/src/lib/utils.ts:111` | `fn(...(args as any))` in `createThrottler` | No | Generic constraint already provides safety; comment why spread cast is needed. |
| `apps/api/src/lib/couch/dbHelpers.ts:139` | `db.insert(finalData as any)` | No | nano types need `MaybeDocument` — add the comment. |
| `apps/api/src/lib/couch/findTags.ts:16` | `...(query?.selector as any)` | No | Same as above; document. |
| `apps/api/src/features/plugins/helpers.ts:96` | `return data as any` | No | Tighten return type or document. |
| `apps/web/src/pages/SearchScreen.tsx:126` | `inputRef={inputRef as any}` | No | Use proper ref type. |
| `apps/web/src/tags/TagsSelector.tsx:61` | `renderValue={renderValue as any}` | No | MUI `SelectProps['renderValue']` already imported — drop the cast and type the variable. |
| `apps/admin/src/routeTree.gen.ts:*` | 10 `as any` | n/a | Generated by TanStack Router, leave alone. |
| `apps/landing/src/features/common/Markdown.tsx:11–34` | `(rest as any)` x4 | No | Use the narrowed `Components` API from `react-markdown`. |
| `apps/web/src/rxdb/collections/link.test.ts:30,40,50` | `as unknown as Record<string,unknown>` | No (test) | OK as test fixtures, comment optional. |

### 5.2 Plain `as TypeName` worth tightening

- `apps/web/src/collections/useCollections.ts:212` — `item?.toJSON() as CollectionDocType`. RxDB's `toJSON()` already returns `DeepReadonlyObject<CollectionDocType>`; the cast strips readonly. Either keep as is with a comment or thread `DeepReadonlyObject` through callers.
- `apps/web/src/collections/CollectionsSelectionDialog.tsx:31` — `{} as Record<string, boolean>` in a reducer init. Replace with `Object.fromEntries` / strongly-typed accumulator.
- `apps/web/src/collections/getCollectionComputedMetadata.ts:55,58` — `as Return` and `{} as Return` in reducer. Same idea; or annotate the accumulator parameter directly.
- `apps/web/src/common/lists/VirtuosoList.tsx:135` — `ref={ref as Ref<HTMLDivElement>}`. Could be solved by typing the parent ref correctly.
- `apps/web/src/books/metadata/index.ts:79,99` — same reducer-cast smell as above.
- `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:76,78,94` — OPF metadata input is genuinely `unknown`-shaped (XML), this is fair, but justify.

### 5.3 `as const` and import alias `as` — fine

Roughly 60% of the matches are `as const` literals or `import { X as Y }` aliases,
which are not type assertions.

---

## 6. MUI `sx` vs dedicated style props (oboku/apps/web)

No instances of the literal anti-pattern `sx={{ display: "flex" }}` (which would
be replaceable with `<Box display="flex">`). MUI v5 actually deprecates the
non-`sx` system props on `Box`, so the literal-anti-pattern flag from the brief
doesn't apply here.

What does apply, per AGENTS.md (`prefer styled over sx and keep underlying name`):

- A handful of components inline 4–10-line `sx={{ ... }}` blocks where extracting
  to `styled(Component)` would be cleaner. Top candidates:
  - `apps/web/src/connectors/ConnectorInfoSection.tsx` — `<Box sx={{ display:"flex", flexDirection:"column", overflow:"auto" }}>` + `<Box sx={{ display:"flex", flexDirection: { xs: "column", sm: "row" }, ... }}>`. Both are single-purpose layout boxes; promote to `ColumnBox` / `ResponsiveActionsBox`.
  - `apps/web/src/connectors/ConnectorForm.tsx` — three substantive `sx` blocks on `<Stack>` / `<Typography>`. Promote to `FormStack`, `ActionsStack`, `HelperTypography`.
  - `apps/web/src/notifications/inbox/cards/NotificationCardBase.tsx` — `<Stack sx={{ gap, mb }}>` and a 4-prop `<Stack sx>` for the action row are good candidates.
  - `apps/web/src/dataSources/reports/ReportSummary.tsx` — single-purpose `<Stack sx={{ gap: 1 }}>`.

The wider repo has many small `sx={{ gap, mt, ... }}` one-liners — those are
fine to keep inline per the "reserve `sx` for one-off, dynamic, or prop-driven
styles" carve-out.

### Counter-pattern: hardcoded `style={{ display: "flex" }}`

`apps/web/src/common/Logo.tsx:7` uses `style={{ flexFlow: "row", display: "flex" }}`
which should be the MUI equivalent (`Stack direction="row"` or styled component)
to keep the styling system consistent.

---

## 7. User-facing strings in shared packages

Only one questionable string in `packages/shared/src`:

- `packages/shared/src/utils/assertNever.ts` throws `new Error(\`Unexpected value: ${String(value)}\`)`. This is an internal/developer error, not a user-facing one — leave as-is.

Otherwise `packages/shared/src` is clean (no labels, alerts, placeholders, etc.).
The error catalogue is intentionally code-only (`ObokuErrorCode` enum) per
AGENTS.md; the human-readable mapping correctly lives in `apps/web` and
`apps/api`.

`packages/synology` is also clean — no UI strings.

---

## Summary table — by impact

| Finding | Files | Impact | Effort |
|---|---|---|---|
| 1.1 Generic RxDB mutation hook | 5 hook files in `books/` and `collections/` | High (~110 LOC, fixes drift) | Medium |
| 1.2 `adminFetchJson` + `adminMutation` helpers | ~12 files in `apps/admin/src/features` | High (~150 LOC, consistent errors) | Medium |
| 1.3 Generic `RenameDialog` | 2 files | Medium (~70 LOC) | Small |
| 2.3 Drop `FC<…>` | ~18 files in `apps/web/src` | Medium (rule compliance) | Small mechanical sweep |
| 2.4 Connector registry | 3 plugin connectors + 1 screen | Small | Small |
| 4.1–4.5 Single-use cleanups | 5 files | Small (–LOC) | Small |
| 5.1 `as any` justifications | ~12 sites | Small (correctness, comments) | Small |
| 6 MUI `styled` extraction | 4–6 files | Small (readability) | Small |
| (fixed in this PR) Dead-code in `search/list/FiltersDrawer.tsx` | 1 file | Bug | Done |

---

## Suggested order of follow-ups

1. Land the `FC` sweep — pure rule compliance, mechanical, no behaviour change.
2. Introduce `adminFetchJson` + migrate one admin hook, then the rest in a follow-up.
3. Introduce `useIncrementalRxDocMutation` and migrate the five wrappers.
4. Connector registry refactor.
5. `RenameDialog` consolidation.
6. `as any` justifications and tightening.

Each of these is small, safe, and does not require touching any user-visible
behaviour.
