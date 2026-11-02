import { Test } from "@nestjs/testing"
import {
  type BookDocType,
  type BookMetadata,
  createBookDefaults,
  type LegacyFileMetadata,
  type LinkDocType,
} from "@oboku/shared"
import { of } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { toFileMetadata } from "../features/metadata/legacy/toFileMetadata.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { BooksMetadataService } from "./books-metadata.service.js"

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

describe("BooksMetadataService.refreshMetadata", () => {
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
})
