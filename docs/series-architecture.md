# Series architecture — design conversation summary

## 1. The problem as stated

Collections in oboku are either real folders in a datasource or created in the UI. Some are flagged as "series", which carries more specific meaning than a plain collection. Both are called shelves.

Book metadata sometimes returns real series information, which creates two problems:

- a book can belong to more than one series
- "if the book is from a known series, its collection should carry the same info" doesn't hold, because collection metadata is fetched separately

Net effect: series information exists on both sides (user/datasource *and* the internet, via book or public-DB metadata) with no principled way to reconcile them.

The three features that motivated the redesign, none of which were implementable:

- display missing books in a series
- completeness of a series
- correct ordering / position

## 2. Findings about the current implementation

### Series-ness is a derived field stored where user intent should live

`CollectionDocType.type?: "series" | "shelve"` is recomputed from the link directive in three places:

- `apps/api/src/features/collections/metadata/processRefreshMetadata.ts:110`
- `apps/api/src/lib/sync/collections/addNewCollection.ts:50`
- `apps/api/src/lib/sync/collections/updateCollection.ts:46`

There is no UI to mark a collection as a series — only display sites reference `type === "series"` — even though `gitbook/guides/collections.md` promises "you can either mark it in the app or use a directive". A UI-created collection has no link, so `extractDirectivesFromName("")` yields `series: undefined` and any manual refresh resets it to `"shelve"`.

### Series identity is never persisted

`fetchMetadata` re-searches every provider by `{ title, year }` on each refresh. The match can silently change between two refreshes and there is no id to reconcile a book-derived claim against.

### Series data is already fetched and discarded

- `comicvine/getSeriesMetadata.ts` types the full search response, then discards `count_of_issues`, `first_issue.issue_number`, `last_issue.issue_number`, and `id`
- `mangaupdates/getSeriesMetadata.ts` discards `record.series_id`
- `mangadex/getSeriesMetadata.ts` discards `result.id`
- `biblioreads/getSeries.ts` walks book → `seriesURL` → series scraper and never stores the URL
- `parseGoogleMetadata.ts:52-56` folds `volumeInfo.seriesInfo.bookDisplayNumber` into the title string
- ComicInfo `Series` / `Number` / `Volume` never surface in `FileMetadata`
- `CollectionMetadata` has an unpopulated `numberOfIssues` and an orphaned `firstIssue: {}` stub carrying a biome-ignore

### `getGoogleSeriesMetadata` is a stub

It takes no arguments and returns `undefined`, yet it is listed in the series sources array, in the web priority map, and in `gitbook/guides/metadata-sources.md` as a series source.

### Every field on `CollectionMetadata` is a series field

`aliases`, `authors`, `numberOfIssues`, `firstIssue`, `startYear`, `publisherName`, `rating`, `cover`, `status` — none of them mean anything for a folder called "to read on the plane".

### Two divergent metadata reducers

- `apps/web/src/collections/getCollectionComputedMetadata.ts` — has a source priority map
- `apps/api/src/lib/collections/computeMetadata.ts` — no priority at all, and overwrites `startYear` with the last entry's value even when `undefined`

### Other relevant state

- `routes.ts:29` declares `LIBRARY_SERIES: "/library/series"`; nothing references it
- `useContinueCollections.ts` filters `type: { $in: ["shelve", null] }` purely to exclude series
- `repairCollectionBooks.ts` exists only to reconcile the `collection.books` ↔ `book.collections` double-write, with two `@todo`s about breaking past 999 books, plus a user-facing repair page
- collection `isNotInterested` is derived from books, not stored on the collection
- collection rxdb schema is at `version: 2` with real migration strategies
- only Google Books runs at *book* level (`getBookSourcesMetadata`); mangadex/comicvine/mangaupdates are series-level only

## 3. The core decision

**Drop `type` from collections. Collections become shelves, period. Introduce a separate, oboku-managed series model driven by metadata resolution.**

The decisive argument: **completeness is only computable from book-level positions.** A shelf is a *set* of books with no positions, so "vol 3 is missing" is unanswerable from it. Position information exists only on the book (ComicInfo `Number`, Google `bookDisplayNumber`, goodreads entry, filename). Wanting completeness therefore *requires* book-driven series membership — which is the same change as removing the user from the loop.

Corollary framing: a series doc has an external referent, so every claim about it is falsifiable. A folder has no referent, so `numberOfIssues` on a collection was never meaningful.

This also dissolves the original blocker. You no longer need every book in a folder to agree on a series. Each book resolves independently; a shelf holding three series is valid; a shelf where 6 of 20 books resolved is valid; and a series spanning four folders is finally representable.

## 4. Durability model

Regenerability is **per-field, not per-doc**, and the discriminator already exists on the document (`linkType` / `linkData` presence).

| | derived (rebuildable) | authored (must survive) |
|---|---|---|
| linked shelf | existence, `books`, `link` metadata entry, `syncAt` | `user` metadata entry (rename), `metadataFetchEnabled`, "don't show me this" |
| UI shelf | — | existence, `books`, title |
| series | everything | **nothing, by design** |

Series is special not because it's derived (shelves are partly derived too) but because its authored slice is *empty*. Consequences:

- the rxdb migration strategy for series can legitimately be discard-and-rebuild, which no other collection in the repo can do
- the resolution algorithm can change freely with no migration path
- **trap:** the moment any user state (hidden, not-interested, merge decision) lands on the series doc, it stops being a pure cache and wipe-and-rebuild must become upsert-preserve on the deterministic `_id`

**Invariant: data flows shelf → series only.** Shelves feed series (folder name, directives, `[oboku~series]` as a resolution hint). Series never writes back to a shelf — no auto-adding books, no renaming, no cover changes. This is what makes a best-effort layer safe.

## 5. Data model

### Shared types

```ts
export type SeriesExternalIds = {
  mangadex?: string
  comicvine?: string
  mangaupdates?: string
  goodreadsSeriesUrl?: string
}

export type SeriesRef = {
  title: string
  position?: number
  ids?: SeriesExternalIds
}
```

### Book: claims vs links

Two distinct things, mirroring the `metadata[].coverLink` vs `bucketCoverKey` relationship (transient observation vs settled state):

```ts
// in BookMetadataFields — a *claim*, per source, re-derived on every refresh
series?: SeriesRef[]

// on BookDocType — the resolved graph edge, stable
series?: { seriesId: string; position?: number; origin: "resolved" | "user" }[]
```

Claims are advertised by `file`, `googleBookApi`, `user`, and the synthetic `directive` entry that `getMetadataFromBook` already builds for `isbn`/`googleVolumeId`. `BOOK_METADATA_FIELDS_BY_SOURCE` follows via its `satisfies`.

Merge rule for claims: **union with dedupe** by id-else-normalized-title, in priority order. Needs explicit handling alongside the existing `date` / `subjects` / `authors` special cases, since `mergeObjects` would otherwise let one source erase another's series.

`seriesId` is **nullable**. Unresolved claims are not an error state.

### Series doc — a pure provider cache

```ts
export type SeriesDocType = CouchDBMeta & RxDbMeta & {
  rx_model: "series"
  /** `series-<provider>-<providerId>` — deterministic, so re-resolution is idempotent. */
  _id: string
  ids: SeriesExternalIds
  metadata?: SeriesMetadata[]
  lastMetadataUpdatedAt?: string
  metadataUpdateStatus?: "fetching" | "idle"
  lastMetadataUpdateError?: string | null
}
```

**No `books` array.** Membership is queried from the book side using the `$elemMatch` pattern already present in `repairCollectionBooks`. This matters: `repairCollectionBooks` (~100 lines), its two 999-book `@todo`s, two sync-report event types, and a user-facing repair page all exist *only* because one edge is stored in two places. A series doc that never stores membership cannot drift, so none of that machinery ever gets built for it.

The status triad (`metadataUpdateStatus` / `lastMetadataStartedAt` / `lastMetadataUpdateError`) is not decoration — it is the lock, mirroring `markCollectionAsFetching`'s re-entrancy guard and `COLLECTION_METADATA_LOCK_MN = 5`.

`SeriesMetadata` is today's `CollectionMetadata` verbatim, minus `link` as a source, plus:

```ts
entries?: { position: number; title?: string; releasedAt?: string }[]
totalEntries?: number
```

The existing per-source-array + priority-merge pattern carries over, which means a `user` entry stays available as an override without building any UI for it.

### Shelf changes

`CollectionMetadata` collapses to `title` (`user` + `link`). `getCollectionComputedMetadata`'s priority map collapses with it, `apps/api/src/lib/collections/computeMetadata.ts` is deleted, and `useContinueCollections`' `type` filter goes away.

## 6. Identity

`_id` and identity are **the same thing**: `series-<provider>-<providerId>`. Deterministic, so "have we resolved this already?" is a `findOne` by id rather than a query over an index, and upsert is naturally idempotent. Cross-provider matches go in `ids`, but one provider owns identity.

Identity providers — all already present in responses the repo parses:

| provider | identity field | status today |
|---|---|---|
| mangadex | `result.id` (uuid) | discarded |
| comicvine | `result.id` (volume id) | discarded |
| mangaupdates | `record.series_id` | discarded |
| goodreads | `book.data.seriesURL` | used transiently in `getSeries.ts` |

**Google Books cannot own identity.** `apps/api/src/lib/google/types.ts:31` types `seriesInfo` as only `{ bookDisplayNumber?: string }` — a position, no name, no id. It is a position source, never an identity source.

Tradeoff accepted: baking the provider into `_id` means a later change of winning provider mints a new doc and orphans the old one. Fine under the disposable framing, but a cleanup pass for orphans is needed or they accumulate silently.

**No placeholder docs for unresolved claims.** Don't mint `series-local-<slug>` — it's a durable artifact of a failure that books then have to be migrated off. Instead the series tab groups by `seriesId` when resolved and by normalized claim title when not. Resolved series render enriched; unresolved render as a plain group. Stage A and Stage B coexist permanently rather than one migrating into the other.

The normalized title is a join key, so it needs an explicit normalize step (case, accents, punctuation, trailing volume markers). `Intl.Collator` handles *comparison* but does not yield a stable key.

## 7. Duplicates

Three distinct sources, with different answers:

**(a) Same book, N providers each minting a doc — avoidable for free.** Query providers in parallel as today, rank hits by provider priority, **highest-priority confident hit owns `_id`**, every other result attaches to *that same doc* as an extra `metadata[]` entry with its id recorded in `ids`. This is `getOrderedBookMetadataSources`' pattern applied to identity instead of fields. Accepting this kind of duplicate costs N× the refresh calls against the same rate limits for zero benefit.

Add a cheap cross-check before attaching a secondary result (title similarity + year proximity). `directives.md` already warns about this exact failure mode: *"mangadex is more designed towards mangas and might give false positive if your series is a comic."* This is **validation**, not entity resolution — a wrong answer costs metadata, not a bogus entity.

**(b) Different books resolving to different providers over time** — book 1 → mangadex today, book 3 → comicvine next week while mangadex is down. Mitigate by **checking locally before minting**: query whether a series doc already covers books making this claim (overlapping `ids`, same normalized title) and reuse it. One local query, no provider call.

**(c) Residual** — reconcile by **co-membership**, which is the strong signal available here and rarely available elsewhere: two series docs sharing most of their book set are the same series. Twelve shared books is near-certainty, far stronger than fuzzy title matching, and computed from local data with no provider call. Because the docs carry no authored state, a periodic reconcile can collapse dupes silently — no merge UI, no user decision, no migration.

**Where to stop:** the tail is genuinely ambiguous *upstream* — comicvine's "Berserk" volume vs its "Berserk Deluxe Edition" volume, a manga vs its colored reprint. Those really are distinct provider records and no algorithm knows which one the user means. Rank by confidence so the weaker sinks; don't auto-merge.

**v0 decision:** allow duplicates of kind (b)/(c); avoid kind (a), since it's an `if`, not a feature.

**Guard:** duplicates must not inflate aggregates. Per-series "12 of 34" stays correct under duplication; a library-wide "you have 40 series" in `StatisticsScreen` does not. Don't ship series-level aggregates in v0.

## 8. The three target features

They need different data, and conflating them is why they felt impossible. Encode the tiers in the type so the UI physically cannot overclaim:

```ts
export type SeriesCompleteness =
  | { kind: "unknown"; owned: number }
  | { kind: "counted"; owned: number; expected: number }
  | { kind: "enumerated"; owned: number; expected: number; missing: SeriesEntry[] }
```

- **Ordering** — needs only per-book position. No series doc, no provider call.
- **Completeness** — needs a count. ComicVine already hands you `count_of_issues`.
- **Missing books** — needs an enumerated entry list. Provider-specific, one extra call.

**Never synthesize expected positions as `1..N` from a count.** Fractional entries (#2.5 novellas), omnibus volumes, and providers counting chapters instead of volumes all break it. Always join against the provider's actual entry list.

**Free correctness signal:** joining owned positions against the entry list validates the match. Own 40 books against a 12-issue volume, or three books at positions absent from the list, and the match is probably wrong. That's a confidence score from data already in hand — and it should gate whether missing-books UI appears at all.

**Two different scores at two different times:**
- creation-time score = title similarity + year proximity → gates what gets created (this is the v0 threshold)
- display-time confidence = position coverage against the entry list → gates what gets shown, and does not exist until after the series refresh

Don't try to make one number do both.

## 9. Provider capabilities

| provider | best tier | notes |
|---|---|---|
| ComicVine | **enumerated** | `count_of_issues` already in hand; issue list via `filter=volume:<id>`. Best case. `issue_number` is a *string* — `"0"`, `"1.MU"`, negatives for prequels |
| MangaDex | **enumerated** (volumes) | `/manga/{id}/aggregate` exposes the volume→chapter tree; volumes are scanlation-derived and often absent for ongoing series |
| Goodreads / biblioreads | likely **enumerated** | series pages carry `#1`, `#2`, `#2.5`. The `series-scraper` is typed here as `{title?, desc?}` — **verify the real payload** |
| MangaUpdates | **counted** at best | volume count tends to live in free-text status on the series detail endpoint — **verify** |
| Google Books | position only | never a completeness source |

Confidence note: ComicVine is certain (its response is typed in-repo). MangaUpdates and biblioreads need verifying against live payloads before typing, per the `SYNO.*` rule in `AGENTS.md`.

**Practical consequence: ship comics/manga first.** Prose via goodreads is the uncertain leg.

### What an ISBN actually buys you

For a book with an ISBN, with ComicVine + Google Books + MangaDex as series providers: **the ISBN never reaches the series lookup.**

- Google Books: `findByISBN` works at *book* level and is the best thing available there. No series identity.
- ComicVine: no ISBN search on volumes. `/search?resources=volume&query=<title>` + `start_year` filter.
- MangaDex: no ISBN concept at all. Title search.

ISBN's entire contribution is sharpening the book-level record, which yields a better title and a position — worth a lot, since title quality is the only lever on match rate.

Trace:

1. **Book refresh** — `findByISBN` → canonical title, authors, `publishedDate`, `seriesInfo.bookDisplayNumber`
2. **Claim extraction** — name from ComicInfo `<Series>`, else volume-markers stripped from the canonical title, else folder hint; position from ComicInfo `<Number>`, else Google's `bookDisplayNumber`
3. **Resolution** — title search against providers in priority order; first confident hit owns `_id`
4. **Series refresh** — by id: ComicVine `count_of_issues` + issue list, MangaDex statistics + aggregate

**Trap: don't feed the book's publication date into the year filter.** `comicvine/getSeriesMetadata` does `!item.start_year || item.start_year === metadata.year` — exact string equality against the *series* start year. A 2019 English reprint of a 1990 manga fails that filter. Series-resolution year must come from the directive/folder hint, and should be a soft ranking signal rather than a hard filter.

**Route providers by format.** `BookMetadataFields.formatType?: ("book" | "comics" | "manga" | "audio")[]` already exists and Google advertises it; `contentType` is available too. An EPUB novel querying ComicVine and MangaDex is pure false-positive surface. Gating on format cuts both provider calls and wrong matches, and makes `metadata-source-x-only` the manual override for a decision that's usually automatic.

## 10. The two-pass pipeline

Keep resolution and refresh separate, or a 429 on a search poisons a refresh that only needed a cheap by-id fetch.

**Resolution** (`claim → identity`): guessy, rate-limited, occasionally wrong. Copies the `collectionRefreshQueue` mechanism verbatim — `synchronizeFromDataSource.ts:88` builds the queue, `:104` flushes and emits per id. A `seriesResolveQueue` flushed the same way gives batching for free, which is what stops a 20-file folder from firing 20 searches. **Group by normalized title scoped by parent shelf; one search per group, not per book.** The comment at `:85-87` explaining why the flush is end-of-sync (so `isCollectionProtected` sees fully-persisted books) applies identically to series protection gating.

**Series refresh** (`identity → content`): boring, cheap, cacheable. Copies `CollectionMetadataService.refreshMetadata` almost line for line — `@OnEvent` in a `series.controller.ts` like `collections.controller.ts:65`, `findOne` → process → `markSeriesAsIdle`, with `onBeforeError(markSeriesAsError)`.

**Trigger:** every existing refresh path is sync-triggered and carries `providerCredentials` + `email`. A series has no link and no provider credentials — it needs only `COMICVINE_API_KEY` plus the user db. So:

- **lazy-on-view** — series screen opened and `lastMetadataUpdatedAt` older than N days → fire the event. Fits well: an ongoing series' status and entry list genuinely drift, and you only care for series someone looks at. Self-limits provider calls to active interest.
- **sync piggyback** — flush stale series at the end of any sync.
- no cron.

**Protection:** a series' books can span datasources, so its protection check must consider *all* linked books, not just those from the triggering sync. Another reason to keep series refresh as its own event outside the datasource sync context.

## 11. Domain reality: books are not movies/TV

Movies and TV have two things books don't: a global id every provider cross-references (IMDb/TMDb/TVDB), and a 1:1 work↔file mapping where an episode's S/E number is agreed by everyone.

Books have neither:

- **ISBN identifies an edition, not a work.** One novel has dozens — hardcover, paperback, ebook, per-country, per-imprint, revisions, reissues. `resources-matching-and-sync.md:59` already says this.
- Often absent (public domain, self-published, scans, scanlations) or wrong (template leftovers).
- **Providers share no key.** MangaDex has no ISBN concept; ComicVine keys on volume+issue; Goodreads has its own work/edition two-level model; Google has volume ids.
- **Work↔file isn't 1:1.** Omnibus editions hold three volumes; a volume can be split across files; scanlations release per chapter; anthologies mix authors.
- **Series numbering is contested** — JP vs licensed EN volume numbers, comics renumbering and legacy numbering across reboots.

The closer analogue is **music**, not video: same problem (work vs release vs recording, many pressings, no universal id), and the industry answer was MusicBrainz's layered entity model plus AcoustID content fingerprinting. Nobody solved it with better metadata. Practically, Calibre, Komga and Kavita all ship fuzzy title+author matching with a manual override, because there is no TMDb of books. **Accepting imperfection plus a cleanup surface is where everyone in this space converged.**

### Known limits to design around

- **Omnibus editions** own several positions in one file. Don't make `position` non-optional; a later `coversPositions?: number[]` can express it.
- **Duplicates** — two files for vol 3 (different scan/language). Dedupe owned positions through a `Set` or completeness exceeds 100%.
- **Fractional and non-numeric positions** are normal, not edge cases.
- **Ongoing series** have no meaningful denominator — render "12 books", not a percentage.

## 12. Write-back loop: correcting the source, not the symptom

`packages/archive-metadata/src/metadata/write.ts` states it outright: *"Today only `isbn` is writable. Expand in lockstep when a new field becomes writable in at least one container."* ComicInfo.xml has `<Series>` and `<Number>`, and `buildPatchedComicInfoXml` already does `upsertChildElement(doc, root, "GTIN", patch.isbn)`.

So series/position write-back is two more `upsertChildElement` calls, a field in `apps/web/src/books/optimize/metadata/MetadataForm.tsx`, and the existing `useUploadToDataSource` path.

This is strictly better than an override in oboku's db: the correction is written **into the file**, so it survives re-sync, re-import, moving datasources — and other apps read ComicInfo too. It also compounds: the next book landing in that folder is matched against an already-corrected library.

For EPUB the equivalent is EPUB 3's `belongs-to-collection` / `group-position` (plus the de-facto `calibre:series` meta) — **verify what `buildPatchedOpfXml` can currently reach** before assuming parity with ComicInfo.

The "clean your library" surface should extend the existing `apps/web/src/problems/ProblemsScreen.tsx` + `useFixCollections.ts` + `useRepair.ts` rather than being a new page, and funnel into the optimize flow.

## 13. UX consequences

- Shelves stay the **default landing view**. "People start asking for the series tab to be the default" is the signal that the derivation graduated — a better quality bar than any invented metric.
- "Imperfect" only works if the UI admits it. A series list showing a weak match with the same authority as a strong one reads as broken; one that visibly ranks or flags low-confidence entries reads as honest.
- Shelf detail loses publisher/status/rating chips (`Header.tsx:115,146`). Fetched covers move to the series, so shelves fall back to `CollectionListItemBookCovers`, which already exists. Where a shelf's books all resolve to one series, its cover can be rendered from that series — derived, no stored state.
- Book page shows "Part of: Berserk #3 · Berserk Deluxe #1" with no shelf required.
- `LIBRARY_SERIES: "/library/series"` is already declared and unused — the slot is waiting.

### The one user escape hatch

Despite "not user-managed": a wrong-match override is required. `resources-matching-and-sync.md` already concedes matching is unreliable, and a book welded to the wrong series with no recourse is worse than no feature. `origin: "user"` on the book's series link — on the durable side, never overwritten by resolution — plus detach. Same tri-state convention as `metadataFetchEnabled`. Costs a field, not a subsystem.

Note it must live on the **book**, not the series doc, or a rebuild eats it.

## 14. Staging

**Stage A** — no new doc type, no resolution step, no provider calls:

- `BookMetadataFields.series` claims
- extraction from ComicInfo `Series`/`Number`, Google `seriesInfo` (stop folding it into the title at `parseGoogleMetadata.ts:52`), the biblioreads `seriesURL`, and a filename/directive fallback
- position-aware ordering — sort by position, fall back to `sortByTitleComparator`, which already natural-sorts `Vol. 2` before `Vol. 12` (`sorting.test.ts:26`)
- a series tab grouping purely from book claims

Ships a working series tab and visible value on its own. Critically, it answers the question you can't currently answer: **how many books in a real library carry a usable series claim at all.** If it's 20%, Stage B's design changes.

**Stage B** — add the cache doc for what can't be computed locally: completeness, missing books, ratings, status, covers. Resolution pass + refresh pass + confidence scoring.

## 15. File-level change map

| File | Change |
|---|---|
| `packages/shared/src/metadata/index.ts` | `SeriesRef` / `SeriesExternalIds`, `series` field + variants, `SeriesMetadata`, split provider-only union out of `CollectionMetadata["type"]` |
| `packages/shared/src/db/docTypes.ts` | `SeriesDocType`, drop `type` from `CollectionDocType`, book `series[]` links |
| `packages/shared/src/collections/index.ts` | shared collection-metadata reducer |
| new `packages/shared/src/series/` | normalize/join-key helper, `resolveSeriesCompleteness`, confidence scoring |
| `apps/api/.../getMetadataFromArchive.ts` | surface ComicInfo `Series`/`Number` (check whether `resolveArchive` exposes them; `archive-metadata` already reads ComicInfo if not) |
| `apps/api/.../parseGoogleMetadata.ts` | emit `series` position instead of baking "Vol N" into the title |
| `apps/api/.../biblioreads/getSeries.ts` + `getBook.ts` | return the discovered `seriesURL` so it can be stored |
| `apps/api/.../comicvine/getSeriesMetadata.ts` | keep `id`, `count_of_issues`, `first_issue`, `last_issue`; add an issue-list fetch |
| `apps/api/.../mangadex/getSeriesMetadata.ts` | keep `result.id`; add `/aggregate` for the volume list |
| `apps/api/.../mangaupdates/getSeriesMetadata.ts` | keep `record.series_id` |
| `apps/api/.../google/getGoogleSeriesMetadata.ts` | delete, or make position-only — currently a stub listed as a real source |
| new `apps/api/src/features/series/` | resolution pass, `SeriesMetadataService`, `series.controller.ts`, lock helpers |
| `apps/api/.../synchronizeFromDataSource.ts` | `seriesResolveQueue` alongside `collectionRefreshQueue` |
| `apps/api/.../processRefreshMetadata.ts` | stop computing `type`; shelf metadata shrinks to title |
| `apps/api/.../addNewCollection.ts`, `updateCollection.ts` | stop writing `type` |
| `apps/api/src/lib/collections/computeMetadata.ts` | delete |
| `apps/web/.../getCollectionComputedMetadata.ts` | delegate to the shared reducer |
| `apps/web/src/rxdb/collections/` | new `series` collection; collection schema v3 |
| `apps/web/src/home/useContinueCollections.ts` | drop the `type` filter |
| `apps/web/src/pages/collections/.../Header.tsx` | drop series chips |
| new series screens | `/library/series` list + detail, wired to `LIBRARY_SERIES` |
| `apps/web/src/books/optimize/metadata/` | series/number fields for write-back |
| `apps/web/src/problems/` | dupes and low-confidence matches surface |
| `gitbook/guides/` | rewrite `collections.md`, `metadata-sources.md`, `directives.md` (series directive becomes a hint) |

## 16. Decisions made

1. Collections are shelves only; `type` is dropped
2. Series is a separate, oboku-managed doc type
3. Series doc stores no membership array — books own the edge
4. `_id` is deterministic from `<provider>-<providerId>`; identity and oboku id are the same thing
5. Series' authored slice is empty by design → disposable, discard-and-rebuild migrations
6. Data flows shelf → series only, never back
7. Book claims (in `metadata[]`) are distinct from book links (on the doc)
8. No placeholder docs for unresolved claims; group by normalized title instead
9. Completeness as a discriminated union; never synthesize `1..N`
10. Two passes — resolution and refresh — with separate triggers
11. One provider owns identity per claim; others enrich
12. v0 tolerates cross-time duplicates, avoids same-book duplicates
13. Two separate scores: creation-time similarity, display-time confidence
14. Route providers by `formatType` / `contentType`
15. Series-resolution year comes from hints, not the book's edition date
16. Wrong-match override lives on the book with `origin: "user"`
17. Shelves stay the default view
18. Write-back to ComicInfo is the preferred correction mechanism
19. Ship comics/manga first; prose is the uncertain leg
20. No library-wide series aggregates in v0

## 17. Open questions

- Should the `googleBookApi` series source be deleted or kept as position-only?
- Does the biblioreads `series-scraper` return the entry list? (verify live payload)
- Where does MangaUpdates expose a volume count? (verify live payload)
- Does `resolveArchive` from `@prose-reader/archive-reader` surface ComicInfo `Series`/`Number`, or does that need adding to `archive-metadata`?
- Can `buildPatchedOpfXml` reach EPUB 3 `belongs-to-collection` / `group-position`?
- Protection policy for a series mixing protected and unprotected books — proposed: skip third-party fetches if any linked book is protected and hasn't opted in
- Orphan-series cleanup pass: when and where?
- Should `useFixCollections`' duplicate detection consider series?

## 18. Related work discovered

**Issue #557 — "Deleting a datasource-backed collection silently resets it instead of removing it"** (https://github.com/mbret/oboku/issues/557)

Independent of the series work. Deleting a linked collection hard-removes the doc, `postRemove` detaches every book, then `syncCollection` finds no candidate and calls `addNewCollection`, recreating it *without* the authored slice (the user's rename, `metadataFetchEnabled`). So delete currently means "reset my customizations and come back in a minute". The only opt-out is a folder-name directive read at `synchronizeFromDataSource.ts:196-198`, i.e. renaming the folder in Google Drive.

Proposed fix: soft-delete for linked collections (one boolean, hidden from read paths, sync keeps updating it but never resurfaces it), hard removal retained for UI-created ones, and relabel the action to "Hide" / "Ignore folder". Reuses the whole existing candidate-matching path because the doc survives, and the authored slice survives for free.
