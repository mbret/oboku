# Codebase Consolidation Audit - oboku

Generated: 2026-04-28

## Output

### Executive summary

The highest-impact consolidation opportunities are small and local: align collection metadata merging between API and web, centralize the repeated Synology Drive request failover loop, and reduce high-risk TypeScript assertions at network/storage boundaries. Pattern drift is most visible in web collection mutation hooks and plugin naming/layout; MUI `sx` cleanup is a safe follow-up batch.

| Priority | Area | Impact | Recommended incremental change |
|---|---|---:|---|
| P1 | Collection metadata computed in API and web | Medium code reduction; avoids stored/display metadata drift | Move string-free primitives for localized title resolution, metadata priority, and null-preserving merge into `@oboku/shared`; keep app wrappers. |
| P1 | Synology Drive request failover duplicated in API and web | Medium code reduction; avoids protocol/status handling drift | Add a transport-agnostic helper in `@oboku/synology` for URL iteration, 404 fallback, and final error status; keep fetch/axios and user-facing messages in app code. |
| P1 | TypeScript assertions at unsafe boundaries | Maintainability and correctness gain | Replace `as any`, double assertions, JSON/Couch/plugin assertions with type guards or typed helper APIs first; leave most `as const` alone. |
| P2 | Collection mutation hook style drift | Lower mental overhead for RxDB writes | Align `useCollectionIncrementalModify` with the `reactjrx` mutation wrapper used by neighboring collection/book flows, or document the exception. |
| P2 | MUI layout props hidden in `sx` | Readability; easy style consistency win | Convert low-risk `Stack sx={{ gap/flexDirection/alignItems }}` cases to `spacing`, `direction`, `alignItems`; keep theme/conditional styles in `sx`. |
| P2 | User-facing strings in shared package | Keeps shared package product-neutral | Move fallback text out of shared error helpers or emit error codes/structured errors for apps to render. |
| P3 | Plugin hook/folder naming drift | Onboarding/searchability | Rename or document narrow cases such as `useGetIsPlugin*`, `useDriveFilesGet`, and plugin `lib/upload/sync` folder conventions. |

### Findings

#### P1 - Collection metadata merge logic is duplicated and drifting

- Evidence:
  - `apps/api/src/lib/collections/computeMetadata.ts:8-18` folds `CollectionMetadata[]`, resolves string vs `title.en`, and keeps `startYear`.
  - `apps/web/src/collections/getCollectionComputedMetadata.ts:18-61` sorts metadata by provider priority, resolves the same localized title shape, and merges with null-preserving behavior.
- Impact: API refresh/storage and web display can diverge when metadata precedence or title resolution changes. The overlap is small now, but it sits on a core domain concept and already has two different implementations.
- Safe consolidation: add pure helpers under `packages/shared/src/metadata` or `packages/shared/src/collections` for:
  - `resolveCollectionTitle(title)`
  - `COLLECTION_METADATA_PRIORITY`
  - `mergeCollectionMetadataEntries(entries)` or a smaller null-preserving merge helper
- Guardrail: keep labels/error messages out of shared; this is data transformation only.

#### P1 - Synology Drive request failover exists in parallel API and web clients

- Evidence:
  - `apps/web/src/plugins/synology-drive/client.ts:52-127` loops through `buildApiUrls`, serializes params, fetches JSON, treats auth statuses specially, continues on browser network `TypeError`, and reports the final status.
  - `apps/api/src/features/plugins/synology-drive/client.ts:98-159` repeats the URL loop and params serialization using axios, custom HTTPS agent support, network-error continuation, and final status reporting.
- Impact: Synology endpoint/status behavior must be updated in two places. Browser-specific user-facing text at `apps/web/src/plugins/synology-drive/client.ts:110-112` should not move to shared, but the retry/failover algorithm can.
- Safe consolidation: in `packages/synology`, introduce a helper that accepts candidate URLs and a transport callback returning status/data/error classification. The apps keep fetch/axios, auth-message mapping, and CORS/certificate copy.

#### P1 - TypeScript assertion usage needs boundary-first cleanup

- Evidence: AST inventory found 231 assertion expressions: 34 `as any`, 30 double/erasing assertions, 65 `as const`, 10 in generated `routeTree.gen.ts`, and only 2 with nearby explanatory comments. Full inventory is in Appendix A.
- Highest-risk examples:
  - `packages/shared/src/dataSources/index.ts:25` returns `data_v2 as any`; it has a local comment but still erases provider-specific data typing.
  - `apps/api/src/features/plugins/helpers.ts:92-94` casts a datasource to `DataSourceDocType` and returns plugin data as `any`.
  - `apps/api/src/lib/couch/dbHelpers.ts:139,355-357`, `apps/api/src/lib/utils.ts:53,108`, and `apps/api/src/covers/covers-s3.service.ts:58-94` use `as any` around external errors and Couch/AWS boundaries.
  - `apps/web/src/connectors/TestConnection.tsx:93`, `apps/web/src/common/selection/EntitySelectionPage.tsx:79`, and `apps/web/src/books/lists/ReadingProgress.tsx:22` use double/ref assertions that hide typing mismatches.
  - `apps/web/src/config/configuration.ts:10`, `apps/web/src/queries/persister.ts:21`, and `apps/web/src/plugins/synology-drive/download/client.ts:15` trust parsed JSON without validation.
- Safe consolidation: handle these in waves: external error guards, JSON validators/parsers, RxDB insert/parser helpers, then generic React/MUI typing workarounds. Do not spend effort replacing idiomatic `as const` query keys unless touched for other reasons.

#### P2 - Collection mutation hooks mix two mutation stacks

- Evidence:
  - `apps/web/src/collections/useCollectionIncrementalUpdate.ts:7-29` uses `useMutation$` with RxDB observables.
  - `apps/web/src/collections/useCollectionIncrementalModify.ts:5-28` uses TanStack `useMutation` for the same collection domain.
  - Callers then mix styles: `apps/web/src/books/helpers.ts:36-75` uses `useCollectionIncrementalUpdate`, while `RenameCollectionDialog.tsx:23` and `useRefreshCollectionMetadata.ts:12` use `useCollectionIncrementalModify`.
- Impact: same entity has different mutation semantics and naming; contributors must remember which hook returns which mutation API.
- Safe consolidation: wrap the incremental modify path with `useMutation$` if it can preserve behavior, or document why collection rename/metadata refresh intentionally remains TanStack.

#### P2 - MUI layout props are often expressed through `sx`

- Evidence:
  - `apps/web/src/books/details/BookDetailsScreen.tsx:60-103`: `Container`/`Stack` use `display`, `flexDirection`, `gap`, `alignItems`, `justifyContent`, `pt`, `mb`, and redundant `display: "flex"` in `sx`.
  - `apps/web/src/connectors/ConnectorInfoSection.tsx:65-78,100-107`: `Box`/`Stack` use flex layout, spacing, and padding in `sx`.
  - `apps/web/src/books/details/MetadataPane.tsx:15-27`: `Stack` uses only `gap`, row direction, and wrap.
  - `apps/web/src/App.tsx:66-71` and `apps/web/src/plugins/synology-drive/InfoScreen.tsx:89-97` use root flex-column layouts in `sx`.
- Impact: not a correctness bug, but it makes layout harder to scan and increases style drift.
- Safe consolidation: start with `Stack sx={{ gap: n }}` -> `spacing={n}`, then `flexDirection` -> `direction`, `alignItems`/`justifyContent` as props. Keep `sx` for palette, pseudo selectors, conditional spreads, custom CSS variables, and complex responsive objects.

#### P2 - Shared package contains user-facing fallback/error strings

- Evidence:
  - `packages/shared/src/microsoft/graph.ts:64-67` includes fallback copy `"Microsoft Graph request failed."`.
  - `packages/shared/src/plugins/credentials.ts:83-86` builds `Invalid provider credentials` copy using Zod issue messages.
  - `packages/shared/src/index.ts:7-17` exports product URLs/social links. URLs are not copy, but they are product-bound shared config.
- Impact: shared-package errors can leak directly to apps and are harder to localize or tailor per UI/API surface.
- Safe consolidation: change shared helpers to throw structured errors/codes and let apps/API map them to human-readable strings. Treat product links as lower-priority config debt unless apps need divergent values.

#### P3 - Plugin and hook naming/layout drift

- Evidence:
  - `apps/web/src/plugins/useIsPluginEnabled.ts:26-32` exports `useGetIsPluginVisible` and `useGetIsPluginEnabled`, but the hooks return static predicate functions rather than fetched/query state.
  - `apps/web/src/google/useDriveFilesGet.ts:36` returns a callable Google Drive file getter; consumers span `useDriveFile.ts`, Google plugin download/access flows, and datasource form code.
  - Plugin folders use a mix of root hooks, `lib/`, `upload/`, and OneDrive-specific `sync/` structure for similar surfaces.
- Impact: mostly discoverability and pattern drift, not runtime risk.
- Safe consolidation: rename only when touching these areas, or add a short `apps/web/src/plugins/README.md` convention for contract hooks vs provider SDK helpers vs upload/sync flows.

### Lower-priority or deferred observations

- `apps/admin/src/features/readResponseErrorMessage.ts` is a pure response-error parser that could move to shared if another app copies it, but there is not enough duplication today to justify promotion.
- `apps/api/src/lib/couch/dbHelpers.ts` and web `dbHelpers.ts` files share a name but not behavior; this is search/onboarding noise, not misplaced shared logic.
- Several exported plugin contract hooks are single-purpose by design; avoid collapsing them unless they are not part of `ObokuPlugin` composition.

### Suggested PR slices

1. **Collection metadata primitives**: shared title resolution + priority + merge tests; swap API/web internals.
2. **Synology request failover helper**: transport-agnostic loop in `@oboku/synology`; keep app-specific errors in apps.
3. **Type assertion cleanup wave 1**: AWS/Couch/plugin error guards and JSON parse validators.
4. **MUI layout props pass**: low-risk `Stack` spacing/direction conversions in the files listed above.
5. **Shared strings cleanup**: structured shared errors and app-owned messages.

### Appendix A - TypeScript `as` assertion inventory

Scope: TypeScript AST `AsExpression` and type-assertion expressions in non-declaration `.ts/.tsx` files. Import aliases and prose comments are excluded. `Comment?` means a nearby leading comment explains or partially explains the assertion; most sites do not currently satisfy the repository rule requiring explanation for necessary assertions.

| Location | Asserted type | Comment? | Replacement assessment |
|---|---|---:|---|
| `apps/admin/src/features/notifications/useAdminNotifications.ts:7` | `const` | No | Keep (literal narrowing) |
| `apps/admin/src/features/serverSources/useServerSources.ts:12` | `const` | No | Keep (literal narrowing) |
| `apps/admin/src/features/serverSources/useServerSync.ts:11` | `const` | No | Keep (literal narrowing) |
| `apps/admin/src/features/useCoverCleanupStats.ts:13` | `const` | No | Keep (literal narrowing) |
| `apps/admin/src/features/useInstanceSettings.ts:6` | `const` | No | Keep (literal narrowing) |
| `apps/admin/src/routeTree.gen.ts:23` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:27` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:32` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:37` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:42` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:47` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:52` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:57` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:62` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routeTree.gen.ts:67` | `any` | No | Generated; fix codegen only |
| `apps/admin/src/routes/_admin.tsx:31` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/covers/covers-fs.service.ts:7` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/covers/covers-s3.service.ts:58` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/covers/covers-s3.service.ts:59` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/covers/covers-s3.service.ts:93` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/covers/covers-s3.service.ts:94` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/features/books/BooksMetadataService.ts:38` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/features/collections/metadata/collections.ts:22` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/features/collections/metadata/collections.ts:39` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/features/collections/metadata/processRefreshMetadata.ts:118` | `\| CollectionMetadata["type"] \| undefined` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/dropbox/index.ts:97` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/features/plugins/dropbox/index.ts:178` | `files.FileMetadataReference` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/dropbox/index.ts:188` | `files.FolderMetadataReference` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/dropbox/index.ts:191` | `files.FolderMetadataReference` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/file/index.ts:39` | `string` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/file/index.ts:46` | `string` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/file/index.ts:49` | `string` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/google/sync.ts:82` | `drive_v3.Schema$File & { id: string }` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/helpers.ts:92` | `DataSourceDocType` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/helpers.ts:94` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/features/plugins/one-drive/graph.ts:63` | `NodeReadableStream` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/plugins.ts:33` | `DataSourcePlugin&lt;T&gt; \| undefined` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/synology-drive/client.ts:52` | `TInput` | No | Use stricter typing if touched |
| `apps/api/src/features/plugins/webdav/operations.ts:61` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/archives/getRarArchive.ts:4` | `ArrayBuffer` | No | Use stricter typing if touched |
| `apps/api/src/lib/archives/getRarArchive.ts:9` | `ArrayBuffer` | No | Use stricter typing if touched |
| `apps/api/src/lib/books/covers/saveCoverFromZipArchiveToBucket.ts:30` | `Buffer` | No | Use stricter typing if touched |
| `apps/api/src/lib/collections/computeMetadata.ts:18` | `CollectionComputedMetadata` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:47` | `Error & { statusCode: unknown }` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:110` | `createNano.DocumentGetResponse & K` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:139` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couch/dbHelpers.ts:149` | `Promise&lt;MangoResponse&lt;DataSourceDocType&gt;&gt;` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:162` | `SettingsDocType` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:178` | `string[]` | No | Use typed seed/generic |
| `apps/api/src/lib/couch/dbHelpers.ts:183` | `(createNano.MangoResponse&lt;unknown&gt;["docs"][number] & D)[]` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/dbHelpers.ts:218` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/couch/dbHelpers.ts:247` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/couch/dbHelpers.ts:355` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couch/dbHelpers.ts:356` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couch/dbHelpers.ts:357` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couch/exists.ts:8` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couch/findOne.ts:51` | `readonly string[]` | No | Use typed seed/generic |
| `apps/api/src/lib/couch/findOne.ts:60` | `string[]` | No | Use typed seed/generic |
| `apps/api/src/lib/couch/findOne.ts:73` | `createNano.MangoResponse&lt;unknown&gt;["docs"][number] & D` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/findTags.ts:13` | `Promise&lt;MangoResponse&lt;TagsDocType&gt;&gt;` | No | Use stricter typing if touched |
| `apps/api/src/lib/couch/findTags.ts:15` | `string[]` | No | Use typed seed/generic |
| `apps/api/src/lib/couch/findTags.ts:16` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/couchDbEntities.ts:26` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:77` | `string[]` | No | Validate or parse before narrowing |
| `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:79` | `string[]` | No | Validate or parse before narrowing |
| `apps/api/src/lib/metadata/opf/parseOpfMetadata.ts:95` | `string \| undefined` | No | Validate or parse before narrowing |
| `apps/api/src/lib/metadata/refineTitle.test.ts:40` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/books/createOrUpdateBook.ts:38` | `SynchronizeAbleItem` | No | Use stricter typing if touched |
| `apps/api/src/lib/sync/books/createOrUpdateBook.ts:70` | `SynchronizeAbleItem[]` | No | Use stricter typing if touched |
| `apps/api/src/lib/sync/collections/addNewCollection.ts:27` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/collections/addNewCollection.ts:50` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/collections/addNewCollection.ts:50` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/collections/updateCollection.ts:33` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/collections/updateCollection.ts:50` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/collections/updateCollection.ts:51` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/lib/sync/synchronizeFromDataSource.ts:26` | `SynchronizeAbleItem` | No | Use stricter typing if touched |
| `apps/api/src/lib/sync/synchronizeFromDataSource.ts:32` | `SynchronizeAbleItem` | No | Use stricter typing if touched |
| `apps/api/src/lib/utils.ts:53` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/utils.ts:53` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/lib/utils.ts:108` | `any` | No | Replace with type guard/typed API |
| `apps/api/src/migrations/migration.service.ts:141` | `Record&lt;string, unknown&gt;` | No | Use stricter typing if touched |
| `apps/api/src/migrations/migration.service.ts:150` | `Record&lt;string, unknown&gt;` | No | Use stricter typing if touched |
| `apps/api/src/migrations/migration.service.ts:302` | `{ statusCode: number }` | No | Use stricter typing if touched |
| `apps/api/src/migrations/migration.service.ts:339` | `const` | No | Keep (literal narrowing) |
| `apps/api/src/migrations/migration.service.ts:809` | `{ $metadata?: { httpStatusCode?: number } }` | No | Use stricter typing if touched |
| `apps/api/src/migrations/migration.service.ts:813` | `{ code?: string }` | No | Use stricter typing if touched |
| `apps/api/src/webdav/handlePropfind.ts:53` | `string` | No | Use stricter typing if touched |
| `apps/landing/src/features/common/Markdown.tsx:7` | `typeof Typography` | No | DOM/library typing workaround |
| `apps/landing/src/features/common/Markdown.tsx:11` | `any` | No | Replace with type guard/typed API |
| `apps/landing/src/features/common/Markdown.tsx:27` | `any` | No | Replace with type guard/typed API |
| `apps/landing/src/features/common/Markdown.tsx:32` | `any` | No | Replace with type guard/typed API |
| `apps/landing/src/features/common/Markdown.tsx:34` | `any` | No | Replace with type guard/typed API |
| `apps/landing/src/utils/extractParams.ts:45` | `{ readonly [Key in keyof Schema]?: Schema[Key] extends "boolean" ? boolean : Schema[Key] extends "string" ? string : Schema[Key] extends "string[]" ? string[] : object }` | No | Use typed seed/generic |
| `apps/web/src/books/details/MetadataSourcePane.tsx:45` | `keyof typeof metadata` | No | Validate or parse before narrowing |
| `apps/web/src/books/helpers.ts:156` | `[typeof addBook]` | No | Use stricter typing if touched |
| `apps/web/src/books/helpers.ts:166` | `BookQueryResult[]` | No | Use stricter typing if touched |
| `apps/web/src/books/lists/ReadingProgress.tsx:22` | `any` | No | Replace with type guard/typed API |
| `apps/web/src/books/metadata.ts:56` | `Return` | No | Use stricter typing if touched |
| `apps/web/src/books/metadata.ts:76` | `Return` | No | Use stricter typing if touched |
| `apps/web/src/collections/CollectionsSelectionDialog.tsx:31` | `Record&lt;string, boolean&gt;` | No | Use typed seed/generic |
| `apps/web/src/collections/getCollectionComputedMetadata.ts:44` | `Return` | No | Use stricter typing if touched |
| `apps/web/src/collections/getCollectionComputedMetadata.ts:58` | `Return` | No | Use stricter typing if touched |
| `apps/web/src/collections/useCollections.ts:206` | `CollectionDocType` | No | Validate or parse before narrowing |
| `apps/web/src/common/dialogs/createDialog.ts:34` | `Result` | No | Use stricter typing if touched |
| `apps/web/src/common/dialogs/createDialog.ts:45` | `Result` | No | Use stricter typing if touched |
| `apps/web/src/common/dialogs/withDialog.ts:12` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/common/lists/VirtuosoList.tsx:133` | `Ref&lt;HTMLDivElement&gt;` | No | DOM/library typing workaround |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:61` | `HTMLDivElement` | No | DOM/library typing workaround |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:63` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:72` | `HTMLDivElement` | No | DOM/library typing workaround |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:73` | `HTMLDivElement` | No | DOM/library typing workaround |
| `apps/web/src/common/lists/useRestoreVirtuosoScroll.ts:75` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/common/selection/EntitySelectionPage.tsx:79` | `&lt;T extends ListFilterItem&gt;( props: EntitySelectionPageProps&lt;T&gt;, ) =&gt; ReactNode` | No | Use stricter typing if touched |
| `apps/web/src/common/selection/EntitySelectionPage.tsx:79` | `unknown` | No | Use stricter typing if touched |
| `apps/web/src/common/selection/useSelectableItemInteractions.ts:185` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/common/selection/useSelectionState.ts:90` | `ItemId[]` | No | Use typed seed/generic |
| `apps/web/src/common/selection/useSelectionState.ts:143` | `ItemId[]` | No | Use typed seed/generic |
| `apps/web/src/common/selection/useSelectionState.ts:144` | `ItemId[]` | No | Use typed seed/generic |
| `apps/web/src/common/useStorageEstimate.ts:22` | `ChromeStorageEstimate` | No | Use stricter typing if touched |
| `apps/web/src/config/configuration.ts:10` | `Partial&lt;GetWebConfigResponse&gt;` | No | Validate or parse before narrowing |
| `apps/web/src/connectors/TestConnection.tsx:93` | `ConnectionExtraParams&lt;D&gt;` | No | Replace with type guard/typed API |
| `apps/web/src/connectors/TestConnection.tsx:93` | `unknown` | No | Replace with type guard/typed API |
| `apps/web/src/connectors/useAddConnector.ts:19` | `Omit&lt;SettingsConnectorDocType, "id"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/dataSources/reports/ReportSummary.tsx:21` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/debug/DebugMenu.tsx:45` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/debug/DebugMenu.tsx:55` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/debug/DebugMenu.tsx:65` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/debug/DebugMenu.tsx:75` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/download/flow/DownloadFlowRequestItem.tsx:270` | `DownloadLink` | No | Use stricter typing if touched |
| `apps/web/src/download/states.ts:83` | `Record&lt;string, ReturnType&lt;typeof mapBookDownloadState&gt;&gt;` | No | Use typed seed/generic |
| `apps/web/src/errors/ErrorMessage.tsx:84` | `ObokuErrorCode` | No | Use stricter typing if touched |
| `apps/web/src/errors/ErrorMessage.tsx:86` | `ObokuErrorCode` | No | Use stricter typing if touched |
| `apps/web/src/google/useDriveFile.ts:11` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/http/httpClient.shared.ts:132` | `HttpClientResponse&lt;unknown&gt;` | No | Use stricter typing if touched |
| `apps/web/src/http/httpClient.shared.ts:149` | `HttpClientResponse&lt;unknown&gt;` | No | Use stricter typing if touched |
| `apps/web/src/http/httpClient.shared.ts:162` | `HttpClientResponse&lt;T&gt;` | No | Use stricter typing if touched |
| `apps/web/src/library/LibraryFiltersDrawer.tsx:103` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/library/LibraryFiltersDrawer.tsx:104` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/library/shelves/filters/ReadingStateFilterDialog.tsx:33` | `ReadingState[]` | No | Use typed seed/generic |
| `apps/web/src/library/shelves/filters/ReadingStateFilterDialog.tsx:46` | `ReadingState` | No | DOM/library typing workaround |
| `apps/web/src/navigation/routes.ts:1` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/queryKeys.ts:8` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/queryKeys.ts:13` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/queryKeys.ts:19` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/queryKeys.ts:24` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/queryKeys.ts:29` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/useArchiveNotification.ts:23` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/useMarkAllNotificationsAsSeen.ts:23` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/notifications/inbox/useMarkNotificationAsSeen.ts:23` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/pages/SearchScreen.tsx:109` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/pages/SearchScreen.tsx:126` | `any` | No | Replace with type guard/typed API |
| `apps/web/src/pages/SettingsScreen.tsx:139` | `LocalSettings["readingFullScreenSwitchMode"][]` | No | Use stricter typing if touched |
| `apps/web/src/pages/SettingsScreen.tsx:171` | `LocalSettings["readingFullScreenSwitchMode"][]` | No | Use stricter typing if touched |
| `apps/web/src/pages/SettingsScreen.tsx:203` | `LocalSettings["showCollectionWithProtectedContent"][]` | No | Use stricter typing if touched |
| `apps/web/src/pages/collections/CollectionDetailsScreen/CollectionDetailsScreen.tsx:101` | `React.CSSProperties` | No | DOM/library typing workaround |
| `apps/web/src/pages/sync/DataSourceDetailsScreen.tsx:48` | `typeof doc` | No | Use stricter typing if touched |
| `apps/web/src/plugins/common/DataSourceFormLayout.tsx:45` | `FieldPath&lt;T&gt;` | No | DOM/library typing workaround |
| `apps/web/src/plugins/common/DataSourceFormLayout.tsx:52` | `FieldPath&lt;T&gt;` | No | DOM/library typing workaround |
| `apps/web/src/plugins/dropbox/lib/auth.ts:87` | `(keyof typeof defaultWindowOptions)[]` | No | Use stricter typing if touched |
| `apps/web/src/plugins/dropbox/lib/auth.ts:120` | `any` | No | Replace with type guard/typed API |
| `apps/web/src/plugins/one-drive/graph/index.ts:14` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/plugins/one-drive/picker/picker.ts:304` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/plugins/one-drive/sync/OneDriveTreeView.tsx:86` | `TreeNode[]` | No | Use typed seed/generic |
| `apps/web/src/plugins/one-drive/sync/useDataSourceItem.ts:8` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/plugins/one-drive/sync/useDataSourceItem.ts:19` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/plugins/synology-drive/download/client.ts:15` | `{ error?: { code?: number } success?: boolean }` | No | Validate or parse before narrowing |
| `apps/web/src/plugins/synology-drive/upload/UploadFileBrowseStep.tsx:65` | `SynologyTreeNode[]` | No | Use typed seed/generic |
| `apps/web/src/plugins/usePluginDataSourceLabel.ts:15` | `\| DeepReadonly&lt;DataSourceDocTypeFor&lt;T&gt;&gt; \| undefined` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:65` | `UseRefreshMetadataVariables&lt;"webdav"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:69` | `UseRefreshMetadataVariables&lt;"synology-drive"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:73` | `UseRefreshMetadataVariables&lt;"dropbox"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:77` | `UseRefreshMetadataVariables&lt;"DRIVE"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:81` | `UseRefreshMetadataVariables&lt;"one-drive"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:85` | `UseRefreshMetadataVariables&lt;"file"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:89` | `UseRefreshMetadataVariables&lt;"URI"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/plugins/usePluginRefreshMetadata.ts:93` | `UseRefreshMetadataVariables&lt;"server"&gt;` | No | Use stricter typing if touched |
| `apps/web/src/problems/ProblemsScreen.tsx:91` | `[string, { name: string; number: number }][]` | No | Use typed seed/generic |
| `apps/web/src/problems/useFixCollections.ts:36` | `DeepMutable&lt;CollectionDocType&gt;` | No | Validate or parse before narrowing |
| `apps/web/src/problems/useFixableBooks.ts:41` | `{ doc: DeepReadonlyObject&lt;BookDocType&gt;; danglingItems: string[] }[]` | No | Use typed seed/generic |
| `apps/web/src/problems/useFixableBooks.ts:60` | `{ doc: DeepReadonlyObject&lt;BookDocType&gt;; danglingItems: string[] }[]` | No | Use typed seed/generic |
| `apps/web/src/problems/useFixableCollections.ts:33` | `{ doc: CollectionDocType; danglingItems: string[] }[]` | No | Use typed seed/generic |
| `apps/web/src/problems/useFixableLinks.ts:15` | `string[]` | No | Use typed seed/generic |
| `apps/web/src/queries/persister.ts:21` | `PersistedClient` | No | Validate or parse before narrowing |
| `apps/web/src/queries/queryClient.ts:12` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/queries/queryClient.ts:13` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/reader/pagination/useCurrentPages.ts:18` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/reader/pagination/useCurrentPages.ts:21` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/reader/settings/SettingsList.tsx:54` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/reader/settings/SettingsList.tsx:83` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/reader/streamer/onManifestSuccess.shared.ts:29` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/rxdb/collections/book.ts:36` | `BookDocType` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/collection.ts:69` | `string \| undefined` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/collection.ts:70` | `string \| undefined` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/collection.ts:71` | `\| Record&lt;string, unknown&gt; \| undefined` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/collection.ts:92` | `CollectionDocType` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/dataSource.ts:60` | `DataSourceDocType` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/link.test.ts:30` | `Record&lt;string, unknown&gt;` | Yes | Replace with type guard/typed API |
| `apps/web/src/rxdb/collections/link.test.ts:30` | `unknown` | Yes | Replace with type guard/typed API |
| `apps/web/src/rxdb/collections/link.test.ts:40` | `Record&lt;string, unknown&gt;` | No | Replace with type guard/typed API |
| `apps/web/src/rxdb/collections/link.test.ts:40` | `unknown` | No | Replace with type guard/typed API |
| `apps/web/src/rxdb/collections/link.test.ts:47` | `Record&lt;string, unknown&gt;` | No | Use stricter typing if touched |
| `apps/web/src/rxdb/collections/link.test.ts:47` | `unknown` | No | Use stricter typing if touched |
| `apps/web/src/rxdb/collections/link.ts:51` | `string` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/link.ts:52` | `string \| undefined` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/link.ts:53` | `Record&lt;string, unknown&gt; \| null` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/link.ts:67` | `LinkDocType` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/collections/settings.ts:113` | `SettingsConnectorDocType` | No | Use stricter typing if touched |
| `apps/web/src/rxdb/collections/tags.ts:50` | `TagsDocType` | No | Validate or parse before narrowing |
| `apps/web/src/rxdb/dexie.ts:19` | `Dexie & { downloads: EntityTable&lt;Downloads, "id"&gt; queryCachePersistence: EntityTable&lt;QueryCachePersistence, "key"&gt; }` | No | Use stricter typing if touched |
| `apps/web/src/search/list/FiltersDrawer.tsx:41` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/search/list/FiltersDrawer.tsx:43` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/search/list/FiltersDrawer.tsx:44` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:12` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:13` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:16` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:21` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:22` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/settings/useLocalSettings.ts:23` | `const` | No | Keep (literal narrowing) |
| `apps/web/src/tags/TagsSelectionDialog.tsx:29` | `Record&lt;string, boolean&gt;` | No | Use typed seed/generic |
| `apps/web/src/tags/TagsSelector.tsx:19` | `string[]` | No | Use typed seed/generic |
| `apps/web/src/tags/TagsSelector.tsx:61` | `any` | No | Replace with type guard/typed API |
| `apps/web/src/tags/helpers.ts:81` | `Record&lt;string, TagsDocType&gt;` | No | Use typed seed/generic |
| `apps/web/src/tags/helpers.ts:139` | `Record&lt;string, DeepReadonlyObject&lt;TagsDocType&gt;&gt;` | No | Use typed seed/generic |
| `apps/web/vite.config.ts:9` | `const` | No | Keep (literal narrowing) |
| `packages/shared/src/dataSources/index.ts:25` | `any` | No | Replace with type guard/typed API |
| `packages/shared/src/db/docTypes.ts:256` | `TagsDocType` | No | Use stricter typing if touched |
| `packages/shared/src/db/docTypes.ts:262` | `BookDocType` | No | Use stricter typing if touched |
| `packages/shared/src/db/docTypes.ts:268` | `LinkDocType` | No | Use stricter typing if touched |
| `packages/shared/src/db/docTypes.ts:274` | `DataSourceDocType` | No | Use stricter typing if touched |
| `packages/shared/src/db/docTypes.ts:280` | `CollectionDocType` | No | Use stricter typing if touched |
| `packages/shared/src/utils/intersection.ts:5` | `Array&lt;Array&lt;T&gt;&gt;` | No | Use stricter typing if touched |
