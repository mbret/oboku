import { Test } from "@nestjs/testing"
import {
  type BookDocType,
  type BookMetadata,
  buildBookBucketCoverKey,
  type CatalogMetadata,
  createBookDefaults,
  type LegacyFileMetadata,
  type LinkDocType,
} from "@oboku/shared"
import {
  FETCHED_METADATA_VERSION,
  type MetadataMatch,
} from "@prose-reader/metadata-fetcher"
import { of } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { toFileMetadata } from "../features/metadata/legacy/toFileMetadata.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { BooksMetadataService } from "./books-metadata.service.js"

type MetadataFetcher = typeof import("@prose-reader/metadata-fetcher")

const { fetchMetadata } = vi.hoisted(function createFetchMetadataSpy() {
  return { fetchMetadata: vi.fn<MetadataFetcher["fetchMetadata"]>() }
})

vi.mock("@prose-reader/metadata-fetcher", async (importOriginal) => ({
  ...(await importOriginal<MetadataFetcher>()),
  fetchMetadata,
}))

const LINK_MODIFIED_AT = "2026-10-01T10:00:00.000Z"

const linkEntry: BookMetadata = {
  type: "link",
  title: "Dune.epub",
  contentType: "application/epub+zip",
  modifiedAt: LINK_MODIFIED_AT,
}

const link: LinkDocType = {
  _id: "link-1",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  type: "URI",
  data: { url: "https://example.com/Dune.epub" },
  book: "book-1",
  rx_model: "link",
  modifiedAt: null,
  createdAt: "1970-01-01T00:00:00.000Z",
}

const bookWith = (
  metadata: BookMetadata[],
  overrides: Partial<BookDocType> = {},
): BookDocType => ({
  ...createBookDefaults(),
  _id: "book-1",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "book",
  links: ["link-1"],
  metadata,
  ...overrides,
})

const acceptedMatch: MetadataMatch = {
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

const refresh = async (book: BookDocType, linkName = "Dune.epub") => {
  const insert = vi.fn(async function storeBook(_doc: BookDocType) {
    return { ok: true }
  })
  const db = {
    find: async ({ selector }: { selector: { rx_model: string } }) => ({
      docs: [selector.rx_model === "link" ? link : book],
    }),
    get: async () => book,
    insert,
  }
  const pluginsService = {
    getFileMetadata: async () => ({
      name: linkName,
      contentType: "application/epub+zip",
      modifiedAt: LINK_MODIFIED_AT,
      canDownload: true,
    }),
    downloadLinkToTmp: vi.fn(async function downloadNothing() {
      return { filepath: undefined }
    }),
  }

  const module = await Test.createTestingModule({
    providers: [
      BooksMetadataService,
      {
        provide: AppConfigService,
        useValue: {
          GOOGLE_BOOK_API_URL: "https://www.googleapis.com/books/v1",
          METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS: ["application/epub+zip"],
        },
      },
      {
        provide: CouchService,
        useValue: { createNanoInstanceForUser: async () => db },
      },
      { provide: CoversService, useValue: { isCoverExist: () => of(true) } },
      { provide: PluginsService, useValue: pluginsService },
      {
        provide: InstanceConfigService,
        useValue: {
          getConfig: () => ({
            value: { fileDownloadMaxSizeBytes: 100_000_000 },
          }),
        },
      },
    ],
  }).compile()

  await module
    .get(BooksMetadataService)
    .refreshMetadata({ bookId: book._id }, {}, "reader@example.com")

  const [storedBook] = insert.mock.lastCall ?? []

  if (!storedBook) throw new Error("The refresh stored no book")

  return { storedBook, downloadLinkToTmp: pluginsService.downloadLinkToTmp }
}

describe("BooksMetadataService.refreshMetadata", () => {
  beforeEach(() => {
    fetchMetadata.mockReset()
    fetchMetadata.mockResolvedValue({
      version: FETCHED_METADATA_VERSION,
      matches: [acceptedMatch],
      sources: {},
      failedProviders: [],
    })
  })

  describe("for an unchanged file it may not download", () => {
    const legacyFileEntry: LegacyFileMetadata = {
      type: "file",
      contentType: "application/epub+zip",
      title: "Dune",
      authors: ["Frank Herbert"],
      coverLink: "OEBPS/cover.jpg",
      coverConfidence: "derived",
    }
    const book = bookWith([linkEntry, legacyFileEntry], {
      metadataFileDownloadEnabled: false,
      metadataFetchEnabled: false,
    })

    it("stores the cached file entry in archive-reader's vocabulary", async () => {
      const { storedBook, downloadLinkToTmp } = await refresh(book)

      expect(downloadLinkToTmp).not.toHaveBeenCalled()
      expect(storedBook.metadata).toContainEqual(
        toFileMetadata(legacyFileEntry),
      )
    })

    it("keeps that entry on the next refresh", async () => {
      const { storedBook: afterFirstRefresh } = await refresh(book)
      const { storedBook: afterSecondRefresh } =
        await refresh(afterFirstRefresh)

      expect(afterSecondRefresh.metadata).toEqual(afterFirstRefresh.metadata)
    })
  })

  describe("for an unchanged file whose cover a confirmed catalog match provides", () => {
    const coverUri = "https://books.google.com/books/content?id=zyTCAlFPjgYC"
    const confirmedCatalogEntry: CatalogMetadata = {
      type: "catalog",
      version: FETCHED_METADATA_VERSION,
      ...acceptedMatch,
      metadata: {
        titles: [{ value: "Dune" }],
        cover: { uri: coverUri, confidence: "derived" },
      },
    }
    const fileWithFirstPageCover = toFileMetadata({
      type: "file",
      coverLink: "page-001.jpg",
      coverConfidence: "assumed",
    })
    const bookWithCatalogCover = (overrides: Partial<BookDocType> = {}) =>
      bookWith([linkEntry, confirmedCatalogEntry, fileWithFirstPageCover], {
        bucketCoverKey: buildBookBucketCoverKey({
          type: "catalog",
          value: coverUri,
        }),
        ...overrides,
      })

    it("does not download the file", async () => {
      const { downloadLinkToTmp } = await refresh(bookWithCatalogCover())

      expect(downloadLinkToTmp).not.toHaveBeenCalled()
    })

    it("downloads the file for its cover when the catalog is no longer asked", async () => {
      const { downloadLinkToTmp } = await refresh(
        bookWithCatalogCover({ metadataFetchEnabled: false }),
      )

      expect(downloadLinkToTmp).toHaveBeenCalled()
    })
  })

  describe("its catalog lookup", () => {
    const legacyCatalogEntry: BookMetadata = {
      type: "googleBookApi",
      title: "Dune",
    }

    it("asks about the book and stores the accepted match", async () => {
      const { storedBook } = await refresh(
        bookWith([linkEntry, legacyCatalogEntry]),
      )

      expect(fetchMetadata).toHaveBeenCalledWith(
        { title: "Dune" },
        expect.objectContaining({ providers: expect.any(Array) }),
      )
      expect(storedBook.metadata).toEqual([
        linkEntry,
        {
          type: "catalog",
          version: FETCHED_METADATA_VERSION,
          ...acceptedMatch,
        },
      ])
    })

    it("keeps the previous entry when a catalog failed and none matched", async () => {
      fetchMetadata.mockResolvedValue({
        version: FETCHED_METADATA_VERSION,
        matches: [],
        sources: {},
        failedProviders: [{ id: "googleBooks", status: 429 }],
      })

      const { storedBook } = await refresh(
        bookWith([linkEntry, legacyCatalogEntry]),
      )

      expect(storedBook.metadata).toEqual([linkEntry, legacyCatalogEntry])
    })

    it("asks nothing and stores no entry when external metadata is off", async () => {
      const { storedBook } = await refresh(
        bookWith([linkEntry, legacyCatalogEntry], {
          metadataFetchEnabled: false,
        }),
      )

      expect(fetchMetadata).not.toHaveBeenCalled()
      expect(storedBook.metadata).toEqual([linkEntry])
    })

    it("asks nothing when the book gives nothing to search on", async () => {
      const { storedBook } = await refresh(
        bookWith([linkEntry, legacyCatalogEntry]),
        "[oboku~tags~unread]",
      )

      expect(fetchMetadata).not.toHaveBeenCalled()
      expect(storedBook.metadata).not.toContainEqual(legacyCatalogEntry)
    })
  })
})
