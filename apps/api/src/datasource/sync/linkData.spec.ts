import type { CollectionDocType, LinkDocTypeForProvider } from "@oboku/shared"
import type createNano from "nano"
import { SyncReport } from "./SyncReport.js"
import { updateCollectionLinkData, updateLinkData } from "./linkData.js"

const storedLink: LinkDocTypeForProvider<"webdav"> = {
  _id: "link-1",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  rx_model: "link",
  type: "webdav",
  book: "book-1",
  data: { connectorId: "connector", filePath: "/books/1.epub", etag: "v1" },
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
}

const storedCollection: CollectionDocType<"webdav"> = {
  _id: "collection-1",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  rx_model: "obokucollection",
  books: [],
  linkType: "webdav",
  linkData: { connectorId: "connector", filePath: "/books", etag: "v1" },
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
}

function createSyncContext(storedDoc: object) {
  const insert = vi.fn<(doc: object) => Promise<{ ok: boolean }>>(
    async function acknowledgeInsert() {
      return { ok: true }
    },
  )
  const syncReport = new SyncReport("data-source", "user")

  return {
    // atomicUpdate only reads and writes the stored document, so the fake
    // leaves out the rest of nano's DocumentScope.
    db: {
      get: async function readStoredDoc() {
        return structuredClone(storedDoc)
      },
      insert,
    } as unknown as createNano.DocumentScope<unknown>,
    insert,
    syncReport,
  }
}

describe("updateLinkData", () => {
  it("writes nothing when the sync reports what the link holds, in any order", async () => {
    const ctx = createSyncContext(storedLink)
    const updateLink = vi.spyOn(ctx.syncReport, "updateLink")

    await updateLinkData(ctx, storedLink, {
      etag: "v1",
      filePath: "/books/1.epub",
      connectorId: "connector",
    })

    expect(ctx.insert).not.toHaveBeenCalled()
    expect(updateLink).not.toHaveBeenCalled()
  })

  it("writes nothing when the sync reports part of what the link holds", async () => {
    const ctx = createSyncContext(storedLink)

    await updateLinkData(ctx, storedLink, {
      connectorId: "connector",
      filePath: "/books/1.epub",
    })

    expect(ctx.insert).not.toHaveBeenCalled()
  })

  it("merges what the sync reports into the link's data, and reports the link", async () => {
    const ctx = createSyncContext(storedLink)
    const updateLink = vi.spyOn(ctx.syncReport, "updateLink")

    await updateLinkData(ctx, storedLink, {
      filePath: "/books/1.epub",
      etag: "v2",
    })

    expect(ctx.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "link-1",
        book: "book-1",
        data: {
          connectorId: "connector",
          filePath: "/books/1.epub",
          etag: "v2",
        },
      }),
    )
    expect(updateLink).toHaveBeenCalledWith("link-1")
  })
})

describe("updateCollectionLinkData", () => {
  it("writes nothing when the sync reports what the collection holds", async () => {
    const ctx = createSyncContext(storedCollection)

    await updateCollectionLinkData(ctx, storedCollection, {
      connectorId: "connector",
      filePath: "/books",
    })

    expect(ctx.insert).not.toHaveBeenCalled()
  })

  it("merges what the sync reports into the collection's link data, and reports the collection", async () => {
    const ctx = createSyncContext(storedCollection)
    const updateCollection = vi.spyOn(ctx.syncReport, "updateCollection")

    await updateCollectionLinkData(ctx, storedCollection, {
      filePath: "/books",
      etag: "v2",
    })

    expect(ctx.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "collection-1",
        books: [],
        linkData: { connectorId: "connector", filePath: "/books", etag: "v2" },
      }),
    )
    expect(updateCollection).toHaveBeenCalledWith("collection-1")
  })
})
