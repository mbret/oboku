import type {
  CatalogMetadata,
  LegacyGoogleBookApiMetadata,
} from "@oboku/shared"
import {
  FETCHED_METADATA_VERSION,
  type FetchedMetadata,
  type MetadataMatch,
} from "@prose-reader/metadata-fetcher"
import { describe, expect, it } from "vitest"
import { nextCatalogEntry } from "./nextCatalogEntry.js"

const titleMatch: MetadataMatch = {
  providerId: "openLibrary",
  score: 0.8,
  accepted: true,
  signals: [
    { field: "title", score: 1, weight: 0.8, query: "Dune", candidate: "Dune" },
  ],
  metadata: { titles: [{ value: "Dune" }] },
  id: "/works/OL893415W",
}

const isbnMatch: MetadataMatch = {
  providerId: "googleBooks",
  score: 1,
  accepted: true,
  signals: [
    {
      field: "isbn",
      score: 1,
      weight: 1,
      query: "9780441013593",
      candidate: "9780441013593",
    },
  ],
  metadata: { titles: [{ value: "Dune" }] },
  id: "zyTCAlFPjgYC",
}

const rejectedMatch: MetadataMatch = {
  ...titleMatch,
  score: 0.2,
  accepted: false,
}

const fetchedWith = (
  matches: MetadataMatch[],
  failedProviders: FetchedMetadata["failedProviders"] = [],
): FetchedMetadata => ({
  version: FETCHED_METADATA_VERSION,
  matches,
  sources: {},
  failedProviders,
})

const previousLegacyEntry: LegacyGoogleBookApiMetadata = {
  type: "googleBookApi",
  title: "Dune",
}

const previousCatalogEntry: CatalogMetadata = {
  type: "catalog",
  version: FETCHED_METADATA_VERSION,
  ...isbnMatch,
}

describe("nextCatalogEntry", () => {
  it("stores the first accepted match with the version it was fetched in", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([rejectedMatch, titleMatch]),
        previousLegacyEntry,
      ),
    ).toEqual({
      type: "catalog",
      version: FETCHED_METADATA_VERSION,
      ...titleMatch,
    })
  })

  it("leaves out the provider's raw record", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([{ ...titleMatch, raw: { kind: "books#volume" } }]),
        undefined,
      ),
    ).not.toHaveProperty("raw")
  })

  it("stores no entry when every catalog answered and none matched", () => {
    expect(
      nextCatalogEntry(fetchedWith([rejectedMatch]), previousLegacyEntry),
    ).toBeUndefined()
  })

  it("stores no entry when there was nothing to search on", () => {
    expect(nextCatalogEntry(undefined, previousLegacyEntry)).toBeUndefined()
  })

  it("keeps the previous entry when a catalog failed and none matched", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([rejectedMatch], [{ id: "googleBooks", status: 429 }]),
        previousLegacyEntry,
      ),
    ).toBe(previousLegacyEntry)
  })

  it("keeps the previous entry over an unconfirmed match while a catalog fails", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([titleMatch], [{ id: "googleBooks", status: 503 }]),
        previousCatalogEntry,
      ),
    ).toBe(previousCatalogEntry)
  })

  it("replaces the previous entry with an identity-confirmed match while a catalog fails", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([isbnMatch], [{ id: "openLibrary" }]),
        previousLegacyEntry,
      ),
    ).toEqual({
      type: "catalog",
      version: FETCHED_METADATA_VERSION,
      ...isbnMatch,
    })
  })

  it("stores an unconfirmed match while a catalog fails when there was no entry", () => {
    expect(
      nextCatalogEntry(
        fetchedWith([titleMatch], [{ id: "googleBooks", status: 503 }]),
        undefined,
      ),
    ).toEqual({
      type: "catalog",
      version: FETCHED_METADATA_VERSION,
      ...titleMatch,
    })
  })
})
