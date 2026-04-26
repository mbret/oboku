# Codebase consolidation audit - 2026-04-26

### Output

Scope: `oboku` monorepo (`apps/*`, `packages/*`). This report focuses on small, incremental consolidation work with clear ownership and low blast radius.

## Executive summary

| Priority | Opportunity | Impact | Safe next step |
| --- | --- | --- | --- |
| High | Consolidate duplicated Synology Drive JSON request fallback loop | Removes duplicated network/error behavior in web and API; prevents future NAS URL fallback drift | Extract a transport-injected helper in `@oboku/synology`; keep web/API wrappers thin |
| High | Consolidate adjacency-list-to-tree builders | Reduces repeated tree assembly logic across web and API plugins | Add a generic shared `buildAdjacencyTree` helper with focused tests; migrate web FileTreeView and OneDrive first |
| High | Remove exact duplicate `hasMinimumValidityLeft` implementation | Deletes dead duplicate code and duplicate tests immediately | Keep `apps/web/src/plugins/common/tokenValidity.ts`; delete root `apps/web/src/plugins/tokenValidity.ts` and its test |
| Medium | Move user-facing/product strings out of `@oboku/shared` | Aligns package boundary with repository rules; keeps app copy localizable | Replace shared English strings with error codes/structured fields where they can surface to users |
| Medium | Remove unused exported helpers/components | Reduces maintenance noise and stale patterns | Delete confirmed zero-consumer exports or convert them to local code if revived |
| Medium | Reduce high-risk `as any` assertions in API boundaries | Improves type safety around CouchDB, S3, plugin SDK, and dynamic payloads | Add small `unknown` type guards at boundary sites |
| Low | Normalize simple MUI `sx` layout usage | Reduces style drift in web UI | Replace simple `sx` layout objects with MUI system props or `Stack` props when touching nearby files |

## 1. Duplicated logic

### High: duplicated Synology Drive JSON request loop

- `apps/web/src/plugins/synology-drive/client.ts:52-127`
- `apps/api/src/features/plugins/synology-drive/client.ts:98-159`

Both implementations build candidate API URLs, serialize the same `URLSearchParams`, loop over fallback URLs, parse JSON on success, treat `404` as "try the next URL", track the last failure, and throw status-based errors. The main differences are transport-specific (`fetch` vs `axios`) and API-only `allowSelfSigned` handling.

**Recommendation:** Add a small helper to `@oboku/synology`, for example `requestSynologyDriveJsonCandidates({ baseUrl, endpoint, params, parse, getJson })`, where callers inject browser/API transport and network-error mapping. This avoids changing public plugin behavior while consolidating fallback semantics.

### High: repeated tree-building algorithm

- `apps/web/src/common/FileTreeView/buildTree.ts:3-32`
- `apps/api/src/features/plugins/one-drive/sync.ts:23-76`
- `apps/api/src/features/plugins/google/sync.ts:16-62`

Each file builds a `Map`, initializes nodes with `children: []`, then performs a second pass to attach children to parents or push roots. Google is a multi-parent variant, but the structure is the same.

**Recommendation:** Add a generic shared helper such as `buildAdjacencyTree(items, { getId, getParentIds })` with single-parent convenience support. Start by migrating `FileTreeView` and OneDrive; migrate Google once the helper supports multi-parent items.

### Medium: duplicated Synology Drive download JSON error detection

- `apps/api/src/features/plugins/synology-drive/client.ts:270-271`, used near `342-343`
- `apps/web/src/plugins/synology-drive/download/client.ts:11-28`, used near `58-59`

Both branches detect JSON content returned from a binary download request and parse it as a Synology error payload.

**Recommendation:** Export one `isJsonContentType` / `parseSynologyDriveDownloadError` path from `@oboku/synology` next to `parseSynologyDriveDownloadErrorPayload`.

### High: exact duplicate token validity helper

- Canonical used helper: `apps/web/src/plugins/common/tokenValidity.ts:1-26`
- Dead duplicate: `apps/web/src/plugins/tokenValidity.ts:1-26`
- Import evidence: OneDrive, Google, and Dropbox import `../../common/tokenValidity`; the root `plugins/tokenValidity.ts` copy is only referenced by its own test.

**Recommendation:** Delete `apps/web/src/plugins/tokenValidity.ts` and `apps/web/src/plugins/tokenValidity.test.ts`; keep `apps/web/src/plugins/common/tokenValidity.test.ts`.

## 2. Pattern drift

### Medium: API utility module mixes generic reusable helpers with API-specific helpers

- `apps/api/src/lib/utils.ts:94-113` (`createThrottler`)
- Used from cloud plugin sync paths such as `apps/api/src/features/plugins/google/sync.ts:71` and `apps/api/src/features/plugins/one-drive/sync.ts:8`

`createThrottler` is pure and reusable, while nearby helpers include filesystem, RxJS, and API formatting concerns.

**Recommendation:** If throttling is needed outside API, move `createThrottler` to `@oboku/shared`. If it remains API-only, at least split it into a focused API utility file to keep `lib/utils.ts` from becoming a catch-all.

### Low: exhaustive switch pattern drift

- `apps/web/src/download/flow/DownloadFlowRequestItem.tsx:266-274`
- Existing project pattern: `assertNever` is exported from `@oboku/shared` in `packages/shared/src/utils/assertNever.ts:1-3`

One web flow uses a manual `never`/assertion-style fallback while neighboring plugin code uses `assertNever`.

**Recommendation:** Replace the local default branch with `assertNever` when this file is next touched.

## 3. Misplaced shared code / shared package boundaries

### Medium: product URLs and design token in `@oboku/shared`

- `packages/shared/src/index.ts:1-17`

`design.palette.orange` and `links` are product/app constants, not shared domain types. The workspace rule says user-facing content should stay in consuming apps.

**Recommendation:** Move these constants into app-local config files (`apps/web`, `apps/landing`, `apps/admin`) or an app-owned package. Keep only structural types in `@oboku/shared`.

### Medium: shared package emits English error strings

- `packages/shared/src/errors.ts:55-58` (`ObokuSharedError: ${code}`)
- `packages/shared/src/microsoft/graph.ts:64-76` (`"Microsoft Graph request failed."`, upstream message pass-through)
- `packages/shared/src/plugins/credentials.ts:82-87` (`Invalid ${type} provider credentials: ...`)
- `packages/shared/src/utils/assertNever.ts:1-3` (`Unexpected value: ...`, developer-facing)
- `packages/shared/src/utils/truncate.ts:5` (`omission = "..."`, visible default if used for UI)

**Recommendation:** Keep error codes, severity, and structured validation issues in `@oboku/shared`; map them to user-facing strings in each consuming app. Developer-only assertion text is lower risk, but app-displayed provider/Graph errors should be prioritized.

## 4. Unused or single-use abstractions

### Medium: confirmed zero-consumer exports

- `apps/api/src/lib/utils.ts:129-134` (`switchMapMergeOuter`) - no repo imports.
- `apps/web/src/common/useTime.tsx:4-10` - no repo imports.
- `apps/web/src/common/network/withOfflineErrorDialog.ts:5-17` - no repo imports.
- `apps/web/src/common/lists/VirtualizedList.tsx:13-26` - no repo imports; list screens use `VirtuosoList`.

**Recommendation:** Delete these in small commits. If `VirtualizedList` is intentionally kept as a future alternative, move it out of active shared components and document that status.

### Low: public surface can be tightened

- `packages/shared/src/utils/objects.ts` exports `is`, while observed consumers use `isShallowEqual`.

**Recommendation:** Make `is` file-private or stop exporting it from the shared barrel if no external consumers depend on it.

## 5. TypeScript `as` assertion audit

The repo contains many `as` occurrences. Import aliases (`Link as MuiLink`) and generated `apps/admin/src/routeTree.gen.ts` assertions are low-value cleanup targets. The highest-risk actionable clusters are below.

| Risk | Location | Comment present? | Safer replacement |
| --- | --- | --- | --- |
| High | `apps/api/src/lib/utils.ts:53`, `apps/api/src/lib/utils.ts:108` | No | Replace `(e as any)` with an `unknown` object guard; avoid `args as any` by typing the throttled function promise return |
| High | `apps/api/src/lib/couch/findTags.ts:16-17` | No | Type the Mango selector shape instead of spreading `query?.selector as any` |
| High | `apps/api/src/lib/couch/dbHelpers.ts:139`, `355-357` | No | Add small Couch error/document guards at the DB boundary |
| High | `apps/api/src/covers/covers-s3.service.ts:58-59`, `93-94` | No | Add an AWS/S3 error guard for `code`, `Code`, and `$metadata.httpStatusCode` |
| High | `apps/api/src/features/plugins/helpers.ts:92-94` | No | Narrow `DataSourceDocType` by `type` before returning data |
| High | `apps/api/src/features/plugins/dropbox/index.ts:97` and `apps/web/src/plugins/dropbox/lib/auth.ts:120` | No | Use SDK response types or runtime payload guards |
| Medium | `apps/web/src/books/lists/ReadingProgress.tsx:22`, `apps/web/src/tags/TagsSelector.tsx:61`, `apps/web/src/pages/SearchScreen.tsx:126` | No | Fix MUI/ref generics instead of `as any` |
| Medium | `apps/web/src/connectors/TestConnection.tsx:93` | Yes | Keep short term; add runtime validation if connector extras become untrusted |
| Medium | `packages/shared/src/dataSources/index.ts:25` | Yes | Replace with overloads or per-type branches if this generic path changes often |
| Low | `packages/shared/src/db/docTypes.ts:256-280` | No | These are type-guard casts; acceptable, but can be tightened with `in` checks |
| Low | `apps/web/src/common/selection/useSelectionState.ts:68`, `121-122` | No | Known `Object.keys` / empty-array inference limitation; acceptable unless this hook is refactored |
| Low | `apps/web/src/rxdb/collections/*.ts` insert assertions | No | Boundary assertions; consider schema validation before insert if migration bugs recur |

**Incremental recommendation:** Start with non-test `as any` in API boundary code (`lib/utils`, Couch helpers, S3 service, plugin helpers). These are the assertions most likely to hide runtime shape drift.

## 6. Styling inconsistencies (`apps/web`, MUI)

Simple `sx` objects that can be expressed with MUI system/layout props:

- `apps/web/src/books/details/BookDetailsScreen.tsx:60` - `Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}` could become a `Stack` or explicit layout props.
- `apps/web/src/books/details/MetadataPane.tsx:39` - `width: "100%"` can be `width="100%"`; keep `bgcolor` if preferred.
- `apps/web/src/common/lists/EmptyList.tsx:54` - `Box` image width can be `width="100%"`.
- `apps/web/src/plugins/synology-drive/InfoScreen.tsx:97` - `Stack sx={{ px: 2, pt: 2 }}` can be `px={2} pt={2}`.
- `apps/web/src/reader/navigation/MoreDialog.tsx:148` and `153` - `padding: 0` can be `p={0}` if `TabPanel` forwards system props.
- `apps/web/src/common/selection/SelectionToolbar.tsx:62`, `apps/web/src/common/FileTreeView/TreeView.tsx:99`, `apps/web/src/library/books/Toolbar.tsx:64`, `apps/web/src/navigation/TopBarNavigation.tsx:84` - simple spacing (`mr`, `ml`) can be promoted if the component supports system props.

Keep `sx` where it is the clearest option, such as SVG icon display fixes (`BookListItemHorizontal.tsx:109`, `BookCoverCard.tsx:232`) or custom components that only expose `sx`.

## Recommended incremental work order

1. Delete dead duplicate token validity helper and confirmed unused web/API exports.
2. Extract Synology Drive request-candidate handling into `@oboku/synology` with tests around 404 fallback and network error propagation.
3. Add a tested shared tree-building helper and migrate web FileTreeView plus OneDrive.
4. Replace high-risk `as any` in API boundaries with small type guards.
5. Move app/product copy and product URLs out of `@oboku/shared`.
6. Opportunistically normalize simple MUI `sx` layout props during nearby UI work.

## Notes and limits

- This was a static audit; no behavior changes were made.
- The `prose-reader` examples in the prompt were not scanned because this workspace contains the `oboku` monorepo only.
- Generated files and import aliases were deprioritized in the TypeScript assertion audit because they are not good consolidation targets.
