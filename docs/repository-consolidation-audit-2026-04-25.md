### Output

# Repository consolidation audit - oboku

Date: 2026-04-25

Scope: `/workspace` oboku monorepo (`apps/*`, `packages/*`). `prose-reader` paths from the prompt are not present in this workspace.

## Executive summary

Highest-impact incremental opportunities:

1. **Consolidate repeated RxDB incremental mutation hooks** in `apps/web`.
2. **Extract connector password hook plumbing** shared by server, WebDAV, and Synology Drive plugins.
3. **Collapse duplicated Google Books request/retry handling** in `apps/api`, fixing incorrect copied error labels.
4. **Unify collection metadata priority/title rules** between API and web before they drift further.
5. **Tighten `@oboku/shared` public surface and user-facing strings** so shared stays mostly types/protocol logic.

No broad rewrite is recommended. Each finding below can be handled as a small PR.

## P1 - High-impact consolidation opportunities

### 1. RxDB incremental mutation hooks repeat the same document-resolution pipeline

**Locations**

- `apps/web/src/books/useIncrementalBookUpdate.ts:7`
- `apps/web/src/books/useIncrementalBookPatch.ts:7`
- `apps/web/src/books/useIncrementalBookModify.ts:7`
- `apps/web/src/collections/useCollectionIncrementalUpdate.ts:7`
- `apps/web/src/dataSources/useDataSourceIncrementalPatch.ts:6`

**Issue**

Each hook resolves `doc: string | RxDocument` by loading from the latest database, returns `of(null)` when missing, then calls an `incremental*` method. The overlap is roughly the whole mutation body, with only collection and operation varying.

**Action**

Add a small web-local RxDB helper, for example `resolveRxDocument$({ collection, doc })`, plus operation-specific wrappers. Start by migrating `useIncrementalBookUpdate` and `useCollectionIncrementalUpdate`; they are nearly identical.

**Impact**

Reduces mutation boilerplate and makes missing-doc behavior consistent across books, collections, and data sources.

### 2. Connector password plugins duplicate refresh/sync credential extraction

**Locations**

- `apps/web/src/plugins/server/useRefreshMetadata.ts:6`
- `apps/web/src/plugins/webdav/useRefreshMetadata.ts:6`
- `apps/web/src/plugins/synology-drive/useRefreshMetadata.ts:5`
- `apps/web/src/plugins/server/useSynchronize.ts:6`
- `apps/web/src/plugins/webdav/useSynchronize.ts:8`
- `apps/web/src/plugins/synology-drive/useSynchronize.ts:6`

**Issue**

Server, WebDAV, and Synology Drive all extract a connector id, call `useExtractConnectorData`, and return `providerCredentials: { password }`. Synology Drive currently throws raw `Error("No connector id")` while server/WebDAV throw `ObokuSharedError(ERROR_CONNECTOR_NOT_CONFIGURED)`.

**Action**

Create one helper/factory for password-backed connector plugins. Standardize missing-connector behavior on `ObokuSharedError` unless Synology has a documented reason to differ.

**Impact**

Removes repeated auth plumbing and fixes visible error behavior drift.

### 3. Google Books API functions duplicate retry/request/error handling

**Location**

- `apps/api/src/lib/google/googleBooksApi.ts:17`
- `apps/api/src/lib/google/googleBooksApi.ts:43`
- `apps/api/src/lib/google/googleBooksApi.ts:70`
- `apps/api/src/lib/google/googleBooksApi.ts:96`

**Issue**

`findByISBN`, `findByTitle`, `findByVolumeId`, and `findSeriesByTitle` repeat `performWithBackoff`, retry-on-429, success status handling, and error throwing. Three copied error paths still throw `An error occurred during findByISBN` from non-ISBN functions (`:67`, `:93`, `:118`).

**Action**

Introduce an internal `googleBooksGet<T>(url, label)` helper and pass the caller label. Keep URL construction in the existing exported functions.

**Impact**

Cuts duplicate request code and fixes misleading production diagnostics.

### 4. Collection metadata merge rules differ between API and web

**Locations**

- `apps/api/src/lib/collections/computeMetadata.ts:8`
- `apps/web/src/collections/getCollectionComputedMetadata.ts:18`
- `apps/api/src/features/collections/metadata/processRefreshMetadata.ts:116`

**Issue**

The API uses a simple last-wins reduce; web sorts metadata by type priority and applies custom null merge behavior; the refresh path has another hard-coded source order. These are related business rules implemented in multiple places.

**Action**

Move only pure shared rules into `packages/shared`, such as `COLLECTION_METADATA_TYPE_PRIORITY` and `resolveCollectionMetadataTitle`. Keep API/web composition wrappers separate until semantics are verified.

**Impact**

Prevents metadata precedence drift without forcing a risky shared mega-function.

## P2 - Medium-impact cleanup opportunities

### 5. Book/collection link mutations duplicate add/remove structure

**Location**

- `apps/web/src/books/helpers.ts:36`
- `apps/web/src/books/helpers.ts:71`

**Issue**

`useAddCollectionToBook` and `useRemoveCollectionFromBook` share the same two-document update pipeline; only `$addToSet` versus `$pullAll` changes.

**Action**

Extract a private helper that accepts the book and collection update fragments.

### 6. Dropbox credential extraction repeats in sync and metadata refresh

**Locations**

- `apps/web/src/plugins/dropbox/useSynchronize.ts:5`
- `apps/web/src/plugins/dropbox/useRefreshMetadata.ts:5`

**Action**

Move the auth-user-to-provider-credentials mapping into a Dropbox `lib` helper.

### 7. Tags by-id reducers duplicate map construction

**Locations**

- `apps/web/src/tags/helpers.ts:72`
- `apps/web/src/tags/helpers.ts:126`

**Action**

Extract a local `tagsToByIdMap` helper or remove the deprecated path if no longer needed.

### 8. Mutation/query pattern drift in web

**Locations**

- `apps/web/src/collections/useCollectionIncrementalUpdate.ts:7` uses `reactjrx` `useMutation$`.
- `apps/web/src/collections/useCollectionIncrementalModify.ts:5` uses TanStack `useMutation`.

**Action**

Document and follow a narrow rule, e.g. RxDB observable mutations use `reactjrx`; HTTP/cache mutations use TanStack Query. Migrate one neighboring hook family at a time when touched.

### 9. Root API build script points at a non-existent package scope

**Locations**

- `package.json:25`
- `apps/api/package.json:2`

**Issue**

Root `build:api` runs `--scope=@oboku/api-legacy`, but the package is named `@oboku/api`.

**Action**

Change the script to `lerna run build --scope=@oboku/api`.

## P2 - Shared package boundary findings

### 10. User-facing strings exist in `packages/shared`

**Locations**

- `packages/shared/src/plugins/credentials.ts:83` - throws `Invalid ${type} provider credentials...`
- `packages/shared/src/microsoft/graph.ts:64` - fallback message `Microsoft Graph request failed.`
- `packages/shared/src/errors.ts:55` - `ObokuSharedError: ${code}`
- `packages/shared/src/utils/assertNever.ts:2` - `Unexpected value: ...`
- `packages/shared/src/index.ts:7` - exported product URLs under `links`

**Action**

Prefer error codes or structured details from shared, with app-owned localized messages. `assertNever` is dev-only and low priority. Treat `links` as a product-constant exception only if intentionally shared.

### 11. `@oboku/shared` exports unused or single-consumer helpers

**Locations**

- `packages/shared/src/utils/objects.ts:7` - `is` has no app imports; `isShallowEqual` is used.
- `packages/shared/src/microsoft/graph.ts:16` - `isMicrosoftGraphError` has no app imports.
- `packages/shared/src/plugins/webdav/index.ts:50` - `normalizeWebdavBaseUrl` appears test-only.
- `packages/shared/src/utils/downloadFileName.ts:9` - sub-helpers are test/internal only; `resolveDownloadFileName` is the real app API.
- `packages/shared/src/index.ts:1` - `design` has one consumer in `apps/landing/src/theme.tsx`.

**Action**

Shrink the public barrel gradually: keep public APIs that have consumers, make sub-helpers file-private, and consider moving `design` to landing unless shared design tokens are an intentional package responsibility.

## P3 - Structure and naming drift

### 12. React `FC` remains in web despite repo rule

Examples:

- `apps/web/src/common/OrDivider.tsx:2`
- `apps/web/src/books/BookCoverCard.tsx:2`
- `apps/web/src/tags/TagsSelector.tsx:1`
- `apps/web/src/navigation/TopBarNavigation.tsx:2`
- `apps/web/src/plugins/types.ts:13`

**Action**

Convert `FC` to explicit props on normal functions opportunistically when editing those files. Do not do a repo-wide churn-only PR unless the team wants one.

### 13. Screen/drawer placement has multiple conventions

Examples:

- `apps/web/src/pages/*Screen.tsx`
- `apps/web/src/books/details/*Screen.tsx`
- `apps/web/src/connectors/*Screen.tsx`
- `apps/web/src/collections/CollectionActionsDrawer/CollectionActionsDrawer.tsx`
- `apps/web/src/books/drawer/BookActionsDrawer.tsx`

**Action**

Pick a convention for new files and migrate only while touching a feature.

## TypeScript `as` assertion audit

Method: searched all `*.ts` and `*.tsx` for assertion-like `as` usage. Generated TanStack route files and import aliases were treated as lower priority. Most `as const` uses are literal narrowing and can remain.

### Highest-value assertion cleanup clusters

| Location | Comment explaining cast? | Suggested replacement |
| --- | --- | --- |
| `apps/api/src/covers/covers-s3.service.ts:58-94` | No | Add AWS error type guard for `code`, `Code`, and `$metadata.httpStatusCode`. |
| `apps/api/src/lib/couch/dbHelpers.ts:47,139,355-357` | No | Centralize Nano/Couch error guards; avoid repeated `(e as any)`. |
| `apps/api/src/lib/couch/findTags.ts:15-17` | No | Type `fields` and selector builder to avoid `any` and promise cast. |
| `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:77-95` | No | Add helpers for scalar-or-array OPF fields. |
| `apps/api/src/lib/sync/books/createOrUpdateBook.ts:38,72` | No | Replace with `isSynchronizeAbleFolder` / array filter type predicate. |
| `apps/api/src/lib/sync/synchronizeFromDataSource.ts:26,32` | No | Replace with discriminant type predicates over the raw item shape. |
| `apps/web/src/config/configuration.ts:10` | No | Validate parsed config before returning `Partial<GetWebConfigResponse>`. |
| `apps/web/src/connectors/TestConnection.tsx:93` | No | Narrow `extra` by connector type instead of double-casting through `unknown`. |
| `apps/web/src/common/useStorageEstimate.ts:22` | No | Feature-detect `usageDetails` with an `in` check. |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:61,72,73` | No | Use `event.currentTarget` typing or a local target guard. |
| `apps/web/src/common/lists/VirtuosoList.tsx:133` | No | Wrap the Virtuoso ref adapter in a typed helper. |
| `apps/web/src/common/selection/useSelectionState.ts:68,121,122` | No | Prefer typed entries/initializer helpers. |
| `apps/web/src/errors/ErrorMessage.tsx:84,86` | No | Add an `isObokuErrorCode` type guard. |
| `apps/web/src/http/httpClient.shared.ts:132,149,162` | No | Make interceptor return types generic enough to avoid response casts. |
| `apps/web/src/library/shelves/filters/ReadingStateFilterDialog.tsx:33,46` | No | Define `readingStates` with `satisfies readonly ReadingState[]` and validate select values. |
| `apps/web/src/plugins/common/DataSourceFormLayout.tsx:45,52` | Yes, `:17` | Acceptable generic React Hook Form limitation; leave unless API changes. |
| `apps/web/src/plugins/dropbox/lib/auth.ts:120` | No | Add runtime shape check for popup response. |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:65-93` | No | Replace switch casts with a discriminated plugin registry helper. |
| `apps/web/src/rxdb/collections/*.ts` inserts and legacy migration fields | Mostly no | Add migration/input validators or comments where RxDB schema guarantees the shape. |
| `packages/shared/src/dataSources/index.ts:25` | No | Make `getDataFromDataSource` generic/discriminated so shared does not return `any`. |
| `packages/shared/src/db/docTypes.ts:256-280` | No | Existing type guards use casts; safer if parameter type has optional `rx_model`. |
| `packages/shared/src/utils/intersection.ts:5` | No | Use a type-predicate filter: `filter((arr): arr is Array<T> => arr != null)`. |

### Low-risk assertion categories

- Query keys and literal options with `as const`, e.g. `apps/web/src/notifications/inbox/queryKeys.ts:12-33`, `apps/admin/src/features/*QueryKey`.
- Generated `apps/admin/src/routeTree.gen.ts:26-71` `as any` casts; do not hand-edit generated code.
- Test-only legacy shape casts, e.g. `apps/web/src/rxdb/collections/link.test.ts:30-50`.

## MUI `sx` prop simplification candidates in `apps/web`

These are cases where dedicated MUI props can replace simple layout/style `sx` values. Treat this as opportunistic cleanup, not a standalone churn PR.

| Location | Current | Suggested |
| --- | --- | --- |
| `apps/web/src/books/details/BookDetailsScreen.tsx:60` | `sx={{ display: "flex", flexDirection: "column", gap: 2 }}` | `display="flex" flexDirection="column" gap={2}` on `Container` if supported by its type, otherwise keep `sx`. |
| `apps/web/src/plugins/synology-drive/InfoScreen.tsx:97` | `<Stack sx={{ px: 2, pt: 2 }}>` | `<Stack px={2} pt={2}>` |
| `apps/web/src/pages/books/$id/tags/BookTagsScreen.tsx:53` | `<Stack sx={{ flex: 1, minHeight: 0 }}>` | `<Stack flex={1} minHeight={0}>` |
| `apps/web/src/pages/books/$id/collections/BookCollectionsScreen.tsx:58` | `<Stack sx={{ flex: 1, minHeight: 0 }}>` | `<Stack flex={1} minHeight={0}>` |
| `apps/web/src/common/selection/SelectionToolbar.tsx:62` | `sx={{ mr: 1 }}` | Use `mr={1}` when component accepts system props; keep `sx` for icon components that do not. |
| `apps/web/src/navigation/TopBarNavigation.tsx:84` | `sx={{ mr: 1 }}` | Same as above. |
| `apps/web/src/library/books/Toolbar.tsx:64` | `sx={{ ml: 2 }}` | Same as above. |

Some `sx` uses should remain because they express CSS-only details (`position`, `bgcolor`, icon `display: "block"`, nested selectors, or responsive object styles).

## Recommended PR sequence

1. Fix `package.json` `build:api` scope and Google Books copied error labels/helper.
2. Extract RxDB incremental document-resolution helper and migrate two hooks.
3. Extract password-backed connector plugin hook helper and align Synology error handling.
4. Move collection metadata priority/title rules to `@oboku/shared`.
5. Tighten shared package exports and replace the highest-risk `as any` clusters with type guards.

