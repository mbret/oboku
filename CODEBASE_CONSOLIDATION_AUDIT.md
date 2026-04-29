# Codebase Consolidation Audit - 2026-04-29

## Scope

- Repository audited: `oboku` monorepo (`apps/*`, `packages/*`).
- No local `prose-reader` repository or `prose-reader/packages/shared` tree exists in this workspace; `@prose-reader/*` is consumed as external packages by `apps/web`.
- Findings below prioritize small, incremental consolidations over broad rewrites.

## Executive summary

Highest-impact opportunities:

1. Consolidate repeated notification mutation option wiring in `apps/web`.
2. Share plugin candidate lookup logic between API `webdav` and `server` plugins.
3. Trim unused exported helpers from `packages/shared` or wire them into existing plugin boundaries.
4. Add comments or safer narrowing for undocumented TypeScript `as` assertions.
5. Move user-facing error strings out of `packages/shared` or expose error codes for app-local messages.

## Prioritized findings

### P1 - Duplicate notification mutation option factories

**Locations**

- `apps/web/src/notifications/inbox/useMarkNotificationAsSeen.ts:21-52`
- `apps/web/src/notifications/inbox/useArchiveNotification.ts:21-50`
- `apps/web/src/notifications/inbox/useMarkAllNotificationsAsSeen.ts:21-49`

**Issue**: Each mutation option object repeats the same TanStack Query skeleton: `mutationKey`, `networkMode: "online"`, `mutationFn`, `onMutate` snapshotting, `onError` rollback, and `onSettled` invalidation.

**Impact**: Medium. Any future cache invalidation or rollback change must be updated in three places.

**Safe consolidation**: Add a local notification mutation factory in `notifications/inbox/queryKeys.ts` or a sibling helper. Keep each mutation's optimistic update callback separate and share only snapshot/rollback/invalidate wiring.

### P1 - Duplicate API plugin candidate lookup for WebDAV-like providers

**Locations**

- `apps/api/src/features/plugins/webdav/index.ts:86-132`
- `apps/api/src/features/plugins/server/index.ts:67-113`

**Issue**: `getLinkCandidatesForItem` and `getCollectionCandidatesForItem` have the same flow in both plugins: read `connectorId`/`filePath`, short-circuit when missing, derive datasource connector id, query `link`/`obokucollection`, then annotate `isUsingSameProviderCredentials`.

**Impact**: Medium. Candidate semantics are easy to drift between two provider implementations.

**Safe consolidation**: Extract a small API helper parameterized by provider type and datasource type, returning `{ links }` or `{ collections }` with the existing Couch selectors unchanged.

### P2 - Repeated provider credential parsing in plugin facade

**Location**

- `apps/api/src/features/plugins/facade.ts:34-66`

**Issue**: `parseProviderApiCredentials(params.link.type, params.providerCredentials)` plus delegation is repeated in `getFolderMetadata`, `getFileMetadata`, and `download`.

**Impact**: Low-medium. Centralizing keeps future credential normalization behavior in one place.

**Safe consolidation**: Add a private helper that parses credentials once and invokes the selected plugin method.

### P2 - Repeated Dropbox client setup

**Location**

- `apps/api/src/features/plugins/dropbox/index.ts:49-88`

**Issue**: `providerCredentials.accessToken`, `new Dropbox({ accessToken: ... })`, and `link.data.fileId` are repeated across folder metadata, file metadata, and download operations.

**Impact**: Low. Mostly readability and consistent token handling.

**Safe consolidation**: Add `createDropboxClient(providerCredentials)` and optionally `getDropboxFileId(link)` in the same module.

### P2 - Nearly identical package Vite library configs

**Locations**

- `packages/shared/vite.config.ts:1-16`
- `packages/synology/vite.config.ts:1-16`

**Issue**: Configs differ only by library `name`.

**Impact**: Low-medium, increasing if more internal packages are added.

**Safe consolidation**: Extract a tiny shared Vite library config factory under root tooling or `config/`.

### P2 - Shared package exposes unused or single-use API surface

**Locations**

- `packages/shared/src/dataSources/index.ts:4-6` - `GoogleDriveDataSourceData` has no workspace consumers.
- `packages/shared/src/plugins/webdav/index.ts:36-60` - `isWebdavLinkData`, `getWebDavLinkData`, and `normalizeWebdavBaseUrl` are unused by apps; `normalizeWebdavBaseUrl` is only tested.
- `packages/shared/src/plugins/uri/index.ts:16-22` - `isUriLinkData` and `getUriLinkData` have no workspace consumers.
- `packages/shared/src/plugins/server/index.ts:38-44` - `isServerLinkData` and `getServerLinkData` have no workspace consumers.
- `packages/shared/src/utils/downloadFileName.ts:9-40` - `getFileNameFromContentDisposition` and `getFileNameFromUrl` are only used internally by `resolveDownloadFileName`.
- `apps/web/src/common/useScroll.ts:30-57` - exported hook has no app consumers.

**Impact**: Medium. Extra exported surface increases maintenance cost and makes it less clear which helpers are intended contracts.

**Safe consolidation**:

1. Make download filename internals module-private.
2. Remove or adopt `useScroll`.
3. Either use link-data parsers at plugin boundaries for consistency or stop exporting them until needed.

### P2 - Pattern drift in QueryClient defaults

**Locations**

- `apps/web/src/queries/queryClient.ts:15-63`
- `apps/admin/src/main.tsx:36`

**Issue**: Web configures query and mutation caches, error behavior, and default `networkMode`/`gcTime`; admin uses `new QueryClient()` directly.

**Impact**: Medium if admin and web should handle errors/offline behavior similarly; otherwise this is an intentional product difference that should be documented.

**Safe consolidation**: Extract shared defaults only for behavior truly common to both apps, or add a short comment in admin explaining why defaults intentionally differ.

### P2 - MUI `sx` props where dedicated layout props fit

**Locations**

- `apps/web/src/common/selection/SelectionToolbar.tsx:67-84`
- `apps/web/src/connectors/ConnectorInfoSection.tsx:65-78`
- `apps/web/src/plugins/synology-drive/InfoScreen.tsx:97`

**Issue**: Several `Stack`/layout components use `sx` for simple layout props (`flexDirection`, `alignItems`, `gap`, `px`, `pt`) that MUI system props or `Stack` props can express directly.

**Impact**: Low-medium. This is small pattern drift that makes layout code less consistent.

**Safe consolidation**: Convert simple cases to `direction`, `alignItems`, `spacing`, `px`, and `pt` where the underlying component supports those props. Keep `sx` for values such as `overflow`, `position`, and component-specific styling.

### P2 - User-facing strings in shared package

**Locations**

- `packages/shared/src/errors.ts:55-58` - fallback message ``ObokuSharedError: ${code}``.
- `packages/shared/src/plugins/credentials.ts:83-87` - `Invalid ${type} provider credentials: ...`.
- `packages/shared/src/utils/assertNever.ts:1-2` - `Unexpected value: ...`.
- `packages/shared/src/microsoft/graph.ts:64-76` - Microsoft Graph response message is propagated through a shared error.

**Impact**: Medium. Shared packages should expose codes/structured detail and let apps decide localized/user-facing copy.

**Safe consolidation**: Keep error codes and structured issue details in `@oboku/shared`; move human-readable rendering to app/API boundaries.

## TypeScript `as` assertion audit

Repository rule: avoid `as` unless necessary, and add an explanatory comment when it is required. The audit below excludes import aliases and generated route files, and prioritizes non-test source.

### Assertions with adequate comments

| Location | Note |
| --- | --- |
| `apps/web/src/books/details/MetadataSourcePane.tsx:28,32` | Explains `styled(Typography)` cast to preserve polymorphic `component`. |
| `apps/web/src/common/selection/EntitySelectionView.tsx:169` | Explains `memo` plus generic component cast. |
| `apps/web/src/connectors/TestConnection.tsx:93` | Explains rest/destructuring inference limitation. |
| `apps/web/src/plugins/common/DataSourceFormLayout.tsx:45,52` | Explains `FieldPath<T>` limitation. |
| `packages/shared/src/dataSources/index.ts:25` | Has a narrowing comment, though `as any` remains broad. |
| `apps/api/src/migrations/migration.service.ts:142,151` | Runtime checks are documented before record casts. |

### Assertions to replace or document first

| Location | Assertion | Suggested action |
| --- | --- | --- |
| `packages/shared/src/utils/intersection.ts:5` | `as Array<Array<T>>` | Prefer a type guard in the filter predicate. |
| `packages/shared/src/db/docTypes.ts:267,273,279,285,291` | document type predicates | Use a shared `hasRxModel(document, value)` guard or comment why assertion is safe. |
| `apps/web/src/config/configuration.ts:10` | parsed config cast | Add schema/runtime validation for external JSON. |
| `apps/web/src/common/useStorageEstimate.ts:22` | browser-specific estimate cast | Add a guard for `usageDetails?.indexedDB`. |
| `apps/web/src/books/lists/ReadingProgress.tsx:22` | `ref as any` | Type the ref/component boundary or document the third-party mismatch. |
| `apps/web/src/tags/TagsSelector.tsx:61` | `renderValue as any` | Type `renderValue` to match MUI `Select` value shape. |
| `apps/web/src/pages/SearchScreen.tsx:126` | `inputRef as any` | Type the ref to the concrete input element. |
| `apps/web/src/plugins/dropbox/lib/auth.ts:120` | `response as any` | Add a response type guard. |
| `apps/api/src/lib/utils.ts:53,108` | `as any` | Replace with `unknown` narrowing and typed variadic helper if possible. |
| `apps/api/src/lib/couch/dbHelpers.ts:139,355-357` | `as any` | Narrow Nano/Couch error shapes once in a helper. |
| `apps/api/src/lib/couch/findTags.ts:16` | selector `as any` | Type selector input more strictly. |
| `apps/api/src/covers/covers-s3.service.ts:58-94` | S3 error `as any` | Add a shared AWS error guard. |
| `apps/api/src/features/plugins/dropbox/index.ts:97` | `(results as any).fileBinary` | Define the Dropbox download response extension or guard property existence. |
| `apps/api/src/features/plugins/helpers.ts:92,94` | datasource cast and `as any` | Use provider-specific overloads or a narrowed helper return. |

### Lower-risk assertions observed

These are mostly `as const`, typed reduce seeds, tuple returns, or persistence-boundary casts. They can remain lower priority but should receive comments if touched:

- `apps/web/src/common/selection/useSelectionState.ts:90,143,144`
- `apps/web/src/common/selection/useSelectableItemInteractions.ts:185`
- `apps/web/src/collections/useCollections.ts:212`
- `apps/web/src/collections/CollectionsSelectionDialog.tsx:31`
- `apps/web/src/collections/getCollectionComputedMetadata.ts:55,58`
- `apps/web/src/books/metadata.ts:56,76`
- `apps/web/src/common/dialogs/createDialog.ts:34,45`
- `apps/web/src/common/dialogs/withDialog.ts:12`
- `apps/web/src/common/lists/VirtuosoList.tsx:135`
- `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:61,63,72,73,75`
- `apps/web/src/books/helpers.ts:168`
- `apps/web/src/settings/useLocalSettings.ts:12,13,16,21,22,23`
- `apps/web/src/tags/TagsSelectionDialog.tsx:29`
- `apps/web/src/tags/helpers.ts:81,139`
- `apps/web/src/rxdb/collections/settings.ts:116`
- `apps/web/src/rxdb/collections/dataSource.ts:60`
- `apps/web/src/rxdb/collections/book.ts:36`
- `apps/web/src/rxdb/collections/collection.ts:70,71,94`
- `apps/web/src/rxdb/collections/tags.ts:50`
- `apps/web/src/rxdb/collections/link.ts:51,52,53,67`
- `apps/web/src/pages/SettingsScreen.tsx:141,173,205`
- `apps/api/src/webdav/handlePropfind.ts:53`
- `apps/api/src/migrations/tolerateMissingUserDb.ts:42`
- `apps/api/src/lib/sync/books/createOrUpdateBook.ts:38,72`
- `apps/api/src/lib/sync/synchronizeFromDataSource.ts:47,53`
- `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:77,79,95`
- `apps/api/src/lib/couch/dbHelpers.ts:47,110,153,162,178,183,218,247`
- `apps/api/src/lib/couch/findTags.ts:15,17`
- `apps/api/src/lib/couch/exists.ts:8`
- `apps/api/src/lib/couch/findOne.ts:51,60,74`
- `apps/api/src/lib/archives/getRarArchive.ts:6,9`
- `apps/api/src/lib/books/covers/saveCoverFromZipArchiveToBucket.ts:30`
- `apps/api/src/lib/collections/computeMetadata.ts:18`
- `apps/api/src/features/plugins/file/index.ts:39,46,49`
- `apps/api/src/features/plugins/plugins.ts:33`
- `apps/api/src/features/plugins/one-drive/graph.ts:63`
- `apps/api/src/features/plugins/synology-drive/client.ts:52`

## Suggested implementation order

1. Notification mutation helper (`apps/web`) - medium impact, narrow scope, easy tests.
2. WebDAV/server candidate helper (`apps/api`) - medium impact, avoids future semantic drift.
3. Shared package API trim - low behavioral risk; remove unused exports or adopt parsers at boundaries.
4. TypeScript assertion cleanup - start with broad `as any` at API boundaries and shared package predicates.
5. MUI layout prop cleanup - opportunistic when touching affected components.
