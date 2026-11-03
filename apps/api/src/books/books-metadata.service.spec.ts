import { Test } from "@nestjs/testing"
import {
  type BookDocType,
  type BookMetadata,
  buildBookBucketCoverKey,
  createBookDefaults,
  type FileMetadata,
  type LegacyFileMetadata,
  type LinkDocType,
} from "@oboku/shared"
import { of } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { BooksMetadataService } from "./books-metadata.service.js"

const { getBookSourcesMetadata } = vi.hoisted(function createLookupSpy() {
  return {
    getBookSourcesMetadata: vi.fn(async function findNoCatalogRecord(
      ..._args: unknown[]
    ) {
      return []
    }),
  }
})

vi.mock("../features/metadata/getBookSourcesMetadata.js", () => ({
  getBookSourcesMetadata,
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

const refresh = async (book: BookDocType) => {
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
      name: "Dune.epub",
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
      { provide: AppConfigService, useValue: {} },
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

const COVER_LINK = "OEBPS/cover.jpg"
const FILE_ISBN = "9780441013593"
const FILE_GOOGLE_VOLUME_ID = "zyTCAlFPjgYC"

const flatFileEntry: LegacyFileMetadata = {
  type: "file",
  contentType: "application/epub+zip",
  title: "Dune",
  authors: ["Frank Herbert"],
  coverLink: COVER_LINK,
  isbn: FILE_ISBN,
  googleVolumeId: FILE_GOOGLE_VOLUME_ID,
}

const resolvedFileEntry: FileMetadata = {
  type: "file",
  version: 5,
  contentType: "application/epub+zip",
  metadata: {
    titles: [{ value: "Dune" }],
    contributors: [{ name: "Frank Herbert", roles: ["author"] }],
    cover: { uri: COVER_LINK, confidence: "derived" },
    identifiers: [
      { value: FILE_ISBN, scheme: "ISBN" },
      { value: FILE_GOOGLE_VOLUME_ID, scheme: "GoogleBooks" },
    ],
  },
}

describe("BooksMetadataService.refreshMetadata", () => {
  beforeEach(() => {
    getBookSourcesMetadata.mockClear()
  })

  describe.each<[string, BookMetadata]>([
    ["flat", flatFileEntry],
    ["archive-reader's", resolvedFileEntry],
  ])(
    "for an unchanged file whose entry is stored in %s shape",
    (_shape, fileEntry) => {
      const bookWithStoredCover = (
        metadata: BookMetadata[],
        overrides: Partial<BookDocType> = {},
      ) =>
        bookWith(metadata, {
          bucketCoverKey: buildBookBucketCoverKey({
            type: "file",
            value: COVER_LINK,
          }),
          ...overrides,
        })

      it("does not download the file", async () => {
        const { downloadLinkToTmp } = await refresh(
          bookWithStoredCover([linkEntry, fileEntry]),
        )

        expect(downloadLinkToTmp).not.toHaveBeenCalled()
      })

      it("keeps the stored file entry as it was", async () => {
        const { storedBook } = await refresh(
          bookWithStoredCover([linkEntry, fileEntry]),
        )

        expect(storedBook.metadata).toContainEqual(fileEntry)
      })

      it("looks the file's ISBN and Google Books volume id up", async () => {
        await refresh(bookWithStoredCover([linkEntry, fileEntry]))

        expect(getBookSourcesMetadata).toHaveBeenCalledWith(
          {
            title: "Dune",
            isbn: FILE_ISBN,
            googleVolumeId: FILE_GOOGLE_VOLUME_ID,
          },
          expect.anything(),
          expect.anything(),
        )
      })

      it("looks the user's ISBN up over the file's", async () => {
        const userEntry: BookMetadata = { type: "user", isbn: "9780593099322" }

        await refresh(bookWithStoredCover([linkEntry, fileEntry, userEntry]))

        expect(getBookSourcesMetadata).toHaveBeenCalledWith(
          expect.objectContaining({ isbn: "9780593099322" }),
          expect.anything(),
          expect.anything(),
        )
      })
    },
  )
})
