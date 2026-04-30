### Output

# Repository consolidation audit - 2026-04-30

Scope: `oboku` monorepo (`apps/*`, `packages/*`).

Note: the prompt also mentioned `prose-reader`, but this checkout only contains
the `oboku` repository.

## Executive summary

Highest-impact incremental opportunities:

1. Remove duplicate auth callback entrypoint definitions in `apps/web`.
2. Consolidate repeated Google Drive scope strings into the existing Google
   constants module.
3. Extract the duplicated Synology Drive request-url retry loop behind a small
   transport callback in `@oboku/synology`.
4. Fix stale root package script drift (`build:api` targets `@oboku/api-legacy`).
5. Triage high-risk TypeScript assertions, especially `as any` and JSON/runtime
   boundary casts, before broad assertion cleanup.

These are small, local changes. None require a feature rewrite.

## Prioritized findings

### P1 - duplicated auth callback entrypoint module

- Locations:
  - `apps/web/src/plugins/authCallbackEntrypoints.shared.ts:1`
  - `apps/web/src/plugins/common/authCallbackEntrypoints.shared.ts:1`
- Evidence: both files contain the same `AuthCallbackEntrypoint` type,
  `dropboxAuthCallbackPath`, `microsoftAuthCallbackPath`,
  `authCallbackEntrypoints`, and `getAuthCallbackRollupInput`.
- Current imports all point at the `common` copy:
  - `apps/web/vite.config.ts:7`
  - `apps/web/src/service-worker.ts:26`
  - `apps/web/src/plugins/dropbox/lib/auth.ts:5`
  - `apps/web/src/plugins/one-drive/auth/auth.ts:23`
- Impact: duplicate configuration can drift and produce inconsistent callback
  HTML entrypoints or service-worker precache paths.
- Recommendation: delete `apps/web/src/plugins/authCallbackEntrypoints.shared.ts`
  if no non-TypeScript consumer references it. If external churn is a concern,
  temporarily replace it with a one-line re-export from `./common/...`.

### P1 - repeated Synology Drive transport loop across web and API

- Locations:
  - `apps/web/src/plugins/synology-drive/client.ts:52`
  - `apps/api/src/features/plugins/synology-drive/client.ts:98`
- Evidence: both `requestJson` functions call `buildApiUrls`, append identical
  query params, try each candidate URL, parse successful JSON, skip 404, and
  throw a final status/network error. They differ only in transport (`fetch`
  vs `axios`) and API-specific options such as `allowSelfSigned`.
- Impact: status handling, fallback behavior, and error wording can drift across
  browser and API Synology integrations.
- Recommendation: add a transport-agnostic helper in `packages/synology`, for
  example `requestSynologyJsonAcrossApiUrls({ baseUrl, endpoint, params,
  request })`, where each app supplies its own fetch/axios callback. Keep
  browser and server error wrapping local.

### P1 - root API build script points at a stale package name

- Location: `package.json:25`
- Evidence: root script is
  `lerna run build --scope=@oboku/api-legacy`, but
  `apps/api/package.json:2` names the package `@oboku/api`.
- Impact: maintainers and CI jobs using `npm run build:api` will target a
  non-existent package.
- Recommendation: change the script scope to `@oboku/api`.

### P2 - repeated Google Drive OAuth scope string

- Locations:
  - `apps/web/src/plugins/google/useSynchronize.ts:15`
  - `apps/web/src/plugins/google/lib/useDrivePicker.tsx:9`
  - `apps/web/src/plugins/google/lib/useHasFilesAccess.ts:31`
  - `apps/web/src/plugins/google/lib/useRequestFilesAccess.ts:21`
  - `apps/web/src/plugins/google/useRefreshMetadata.ts:27`
- Evidence: all repeat `https://www.googleapis.com/auth/drive.file`.
  `apps/web/src/plugins/google/lib/constants.ts:1` already centralizes
  plugin-level constants.
- Impact: scope changes must be updated in five places and can drift silently.
- Recommendation: add `GOOGLE_DRIVE_FILE_SCOPE` or
  `GOOGLE_DRIVE_FILE_SCOPES` to `lib/constants.ts` and import it at these
  callsites.

### P2 - stale conflict watcher implementation lives beside the active one

- Locations:
  - Active: `apps/web/src/rxdb/replication/conflicts/useWatchAndFixConflicts.ts`
  - Stale/commented: `apps/web/src/rxdb/replication/useWatchAndFixConflicts.ts`
- Evidence: `useBackgroundReplication.ts` imports the `conflicts/` module;
  the sibling file is mostly commented legacy code.
- Impact: future conflict-resolution changes have two apparent homes.
- Recommendation: delete the commented legacy file or replace it with a short
  pointer comment if historical context is still useful.

### P2 - mutation hook pattern drift in `apps/web`

- Examples:
  - `apps/web/src/connectors/useAddConnector.ts:14` uses `useMutation$`.
  - `apps/web/src/connectors/TestConnection.tsx:149` uses `useMutation`.
  - `apps/web/src/collections/useUpdateCollectionBooks.ts:8` uses
    `useMutation$`.
  - `apps/web/src/collections/useCreateCollection.ts:7` uses `useMutation`.
  - `apps/web/src/books/helpers.ts:17` and `:28` use `useMutation`, while
    `:40` and `:75` use `useMutation$`.
- Impact: contributors must infer when RxJS-backed mutations are expected.
- Recommendation: document the default choice for new web mutations. Then
  migrate one feature folder at a time only when touching that feature.

### P2 - app/shared boundary: generic concurrency helper is local

- Location: `apps/api/src/features/plugins/synology-drive/client.ts:40`
- Evidence: `mapWithConcurrency` is a generic helper with no Synology-specific
  dependency; it is local to one API feature.
- Impact: future bounded-concurrency work is likely to reimplement the same
  pattern.
- Recommendation: if another production callsite appears, move this to a shared
  utility location. Until then, keep it local to avoid premature shared surface.

## Unused or single-use abstractions

### Delete candidates

- `apps/web/src/common/network/withOfflineErrorDialog.ts:5`
  - Exported helper, no imports found.
  - Recommendation: delete unless a near-term sync/download pipeline will use it.
- `apps/web/src/common/useTime.tsx:4`
  - Exported hook, no imports found.
  - Recommendation: delete.
- `apps/web/src/common/useScroll.ts:30`
  - Exported hook, no imports found.
  - Recommendation: delete with its local `ScrollTarget` type.

### Reduce public surface

- `apps/web/src/common/utils.tsx:3`
  - `isMobileDetected` is only used by `IS_MOBILE_DEVICE` in the same file.
  - Recommendation: make `isMobileDetected` module-local and export only the
    constant.
- `apps/web/src/common/forms/ControlledTextFieldSelect.tsx:6`
  - Only consumed by `ControlledSecretSelect.tsx`.
  - Recommendation: keep if it is expected to gain more form callsites; otherwise
    inline it to remove an exported wrapper.
- `apps/web/src/common/useStorageEstimate.ts:11`
  - Only consumed by `settings/useStorageUse.ts`.
  - Recommendation: merge into `useStorageUse` unless more direct storage
    estimate callers are planned.

## TypeScript `as` assertion audit

Text scan summary, excluding obvious import aliases from the priority review:

- Candidate `as` lines: 263
- Distribution:
  - `apps/web`: 157
  - `apps/api`: 73
  - `apps/admin`: 14
  - `apps/landing`: 10
  - `packages/shared`: 9

Most findings are benign `as const`, generated code, test fixtures, or import
aliases. Prioritize the high-risk assertions below.

### Highest-risk or undocumented assertions

| Location | Comment? | Risk | Recommendation |
| --- | --- | --- | --- |
| `packages/shared/src/dataSources/index.ts:25` | Yes, but still `as any` | Shared generic masks provider-specific `data_v2` typing. | Replace with discriminated branches or a typed extractor map. |
| `packages/shared/src/db/docTypes.ts:267` | No | Type guard reads `rx_model` through an assertion. | Check `typeof document === "object"`, non-null, and `"rx_model" in document` before comparing. Repeat for lines `273`, `279`, `285`, `291`. |
| `packages/shared/src/utils/intersection.ts:5` | No | Filter result cast can hide non-array values. | Use a filter predicate: `(arr): arr is Array<T> => arr != null`. |
| `apps/web/src/config/configuration.ts:10` | No | `JSON.parse` trusted as config shape. | Validate parsed config at runtime or parse to `unknown` and normalize. |
| `apps/web/src/connectors/useAddConnector.ts:22` | No | Object literal forced into insert shape. | Use `satisfies Omit<SettingsConnectorDocType, "id">` if compatible. |
| `apps/web/src/common/dialogs/createDialog.ts:34` and `:45` | No | Dialog result is cast instead of typed through callback chain. | Make `onConfirm` generic over `Result` or use overloads. |
| `apps/web/src/common/lists/VirtuosoList.tsx:135` | No | Ref cast can break at runtime if component ref target changes. | Type the wrapped component/ref as `HTMLDivElement`. |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:61`, `:72`, `:73` | No | Event target assumed to be `HTMLDivElement`. | Guard with `target instanceof HTMLDivElement`. |
| `apps/web/src/common/useStorageEstimate.ts:22` | No | Browser-specific storage estimate fields assumed. | Use `"usageDetails" in estimate` and nested property checks. |
| `apps/web/src/books/lists/ReadingProgress.tsx:22` | No, `as any` | Ref typing is erased. | Forward the exact DOM ref type through the component. |
| `apps/web/src/tags/TagsSelector.tsx:19`, `:61` | No, includes `as any` | MUI select value/renderValue typing is bypassed. | Narrow `event.target.value` and type `renderValue` through MUI/RHF generics. |
| `apps/web/src/pages/SearchScreen.tsx:126` | No, `as any` | Input ref type mismatch hidden. | Use a callback ref or align `CompositeComponent` ref type. |
| `apps/api/src/lib/utils.ts:53`, `:108` | No, `as any` | Error/message and variadic args bypass types. | Add `hasMessage(error)` guard and type `debounce` args generically. |
| `apps/api/src/lib/couch/dbHelpers.ts:139`, `:355-357` | No, `as any` | Couch insert/error handling is unchecked. | Add `isNanoError`/`hasStatusCode` helpers and type insert payloads. |
| `apps/api/src/features/plugins/helpers.ts:94` | No, `as any` | Plugin data boundary loses provider typing. | Return provider-specific data via discriminated plugin map. |
| `apps/api/src/features/plugins/dropbox/index.ts:97` | No, `as any` | Dropbox SDK result shape assumed. | Narrow SDK response with property checks before using `fileBinary`. |
| `apps/landing/src/features/common/Markdown.tsx:11`, `:27`, `:32`, `:34` | No, `as any` | Markdown component props are spread without type safety. | Define typed MDX/markdown component prop adapters. |

### Documented assertions that can remain for now

- `apps/web/src/connectors/TestConnection.tsx:93`
  - Has a nearby comment explaining TypeScript cannot infer the spread/omit
    relationship.
- `apps/web/src/common/selection/EntitySelectionView.tsx:169`
  - Has a nearby comment explaining `memo` erases generic inference.
- `apps/web/src/books/details/MetadataSourcePane.tsx:28` and `:32`
  - Has a nearby comment explaining `styled(Typography)` erases the
    polymorphic `component` prop.
- `apps/web/src/plugins/common/DataSourceFormLayout.tsx`
  - Existing comments explain the generic `FieldPath` assertions.
- `apps/api/src/migrations/migration.service.ts:142` and `:151`
  - Nearby comments and runtime checks make these acceptable legacy-data
    boundary casts.

### Lower-priority assertion categories

- `as const` tuple/literal narrowing in query keys, status literals, and
  generated route code: keep.
- Test fixture assertions for legacy shapes: keep, but add comments when they
  intentionally violate production types.
- `apps/admin/src/routeTree.gen.ts`: generated `as any` sites should be fixed
  by the generator or regeneration, not by hand.

## MUI `sx` styling inconsistencies in `apps/web`

Focus on simple static `sx` props where a dedicated prop or styled component
would reduce drift.

| Location | Current pattern | Recommendation |
| --- | --- | --- |
| `apps/web/src/common/lists/EmptyList.tsx:54` | `sx={{ width: "100%" }}` | Use `width="100%"` if the component supports system props. |
| `apps/web/src/common/FileTreeView/TreeView.tsx:99` | icon `sx={{ mr: 1 }}` | Extract a named `styled(LabelIcon)` with the underlying component suffix. |
| `apps/web/src/common/selection/SelectionToolbar.tsx:62` | `sx={{ mr: 1 }}` | Use a named styled component for repeated toolbar spacing. |
| `apps/web/src/books/lists/BookListItemHorizontal.tsx:109` | icon `sx={{ display: "block" }}` | Prefer a styled plugin icon wrapper if used with other book cover/list icons. |
| `apps/web/src/books/lists/BookListItemHorizontal.tsx:322` | `sx={{ mt: "auto" }}` | Use a styled `Stack`/`Box` for flex child positioning. |
| `apps/web/src/books/BookCoverCard.tsx:232` | icon `sx={{ display: "block" }}` | Consolidate with the horizontal list icon styling if extracted. |
| `apps/web/src/books/details/MetadataPane.tsx:39` | `sx={{ width: "100%", bgcolor: "background.paper" }}` | Use `width="100%"`; move static background to styled component if it remains. |
| `apps/web/src/library/books/Toolbar.tsx:64` | `sx={{ ml: 2 }}` | Prefer a named styled toolbar child. |
| `apps/web/src/navigation/TopBarNavigation.tsx:88` | `sx={{ mr: 1 }}` | Prefer a named styled `IconButton`. |
| `apps/web/src/plugins/synology-drive/InfoScreen.tsx:97` | `Stack sx={{ px: 2, pt: 2 }}` | Use `px={2}` and `pt={2}` or a named styled `Stack`. |

Recommendation: do not run a repo-wide `sx` cleanup. Convert static layout
blocks opportunistically when touching each component; keep `sx` for genuinely
dynamic values.

## User-facing strings in shared packages

### `packages/shared`

- `packages/shared/src/microsoft/graph.ts:67`
  - String: `"Microsoft Graph request failed."`
  - Recommendation: shared should expose an error code/status and let the
    consuming app provide user-facing fallback copy.
- `packages/shared/src/errors.ts`
  - Default messages include `ObokuSharedError: ${code}` and may echo previous
    error messages.
  - Recommendation: keep `Error.message` suitable for logs, but ensure app UI
    maps `ObokuErrorCode` to localized copy rather than displaying this string.
- `packages/shared/src/utils/assertNever.ts:2`
  - String: `Unexpected value: ...`
  - Recommendation: acceptable as developer-only assertion text, but do not
    surface it directly to users.
- `packages/shared/src/plugins/credentials.ts:83`
  - String: `Invalid ${type} provider credentials: ...`
  - Recommendation: throw a structured shared error with issues, and let web/API
    format localized messages. This also avoids leaking Zod's English defaults.

### `prose-reader/packages/shared`

Not present in this checkout.

## Additional pattern drift

- Root formatting/linting uses Biome (`package.json:29-30`), while
  `apps/api/package.json` still carries package-local Prettier/ESLint scripts.
  Align gradually when touching API code, or document the split explicitly.
- `@tanstack/react-query` versions differ between web and admin:
  - `apps/admin/package.json`: `^5.71.5`
  - `apps/web/package.json`: `^5.62.8`
  Align during the next dependency maintenance pass.

## Suggested implementation order

1. Fix `package.json` `build:api` scope.
2. Remove or re-export the duplicate auth callback entrypoint file.
3. Add a Google Drive scope constant and update five callsites.
4. Delete the clearly unused hooks/helpers listed above.
5. Extract the Synology Drive request-url loop after adding focused tests for
   web/API fallback behavior.
6. Triage `as any` assertions with small guards at runtime boundaries.

## Checks performed

- File and package discovery via glob searches.
- Direct reads of duplicated modules and shared-package string sources.
- Ripgrep checks for:
  - duplicate auth callback imports,
  - repeated Google Drive scope strings,
  - `useMutation`/`useMutation$` callsites,
  - unused helper names,
  - simple static `sx={{ ... }}` patterns,
  - TypeScript `as` assertion candidates.
- Python text scan for TypeScript `as` candidate lines. This intentionally
  over-counts some prose strings and misses AST-only nuance, so the report
  prioritizes directly verified high-risk assertions.
