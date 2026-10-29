import type { DataSourceDocTypeFor, OpdsLinkData } from "@oboku/shared"
import type createNano from "nano"
import { SyncReport } from "../../datasource/sync/SyncReport.js"
import { MODIFIED_AT_UNSUPPORTED, type SyncContext } from "../types.js"
import { password } from "./catalog.fixture.js"
import { dataSource as opdsDataSource } from "./index.js"

const bookLinkData = {
  connectorId: "connector",
  entryId: "urn:book:1",
  title: "Book 1",
  acquisition: {
    href: "https://catalog.example.com/1.epub",
    type: "application/epub+zip",
    length: 1024,
  },
} satisfies OpdsLinkData

const folderLinkData = {
  connectorId: "connector",
  feedUrl: "https://catalog.example.com/opds/series/1",
  title: "Series 1",
} satisfies OpdsLinkData

const dataSource: DataSourceDocTypeFor<"opds"> = {
  _id: "data-source",
  _rev: "1-data-source",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  type: "opds",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
  data_v2: {
    connectorId: "connector",
    feedUrl: "https://catalog.example.com/opds",
  },
}

function createSyncContext() {
  const find = vi.fn<(query: object) => Promise<{ docs: [] }>>(
    async function findNothing() {
      return { docs: [] }
    },
  )
  const ctx: SyncContext<"opds"> = {
    userName: "user",
    dataSourceId: "data-source",
    dataSourceType: "opds",
    dataSource,
    providerCredentials: { password },
    syncReport: new SyncReport("data-source", "user"),
    // Partial fake: candidates are found through `find` only.
    db: { find } as unknown as createNano.DocumentScope<unknown>,
  }

  return { ctx, find }
}

const fileItem = (linkData: OpdsLinkData) => ({
  type: "file" as const,
  name: linkData.title,
  modifiedAt: "2026-01-01T00:00:00.000Z",
  linkData,
})

const folderItem = (linkData: OpdsLinkData) => ({
  ...fileItem(linkData),
  type: "folder" as const,
})

describe("OPDS data source", () => {
  it("finds a book's links by its connector and entry id", async () => {
    const { ctx, find } = createSyncContext()

    await opdsDataSource.getLinkCandidatesForItem(fileItem(bookLinkData), ctx)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          rx_model: "link",
          type: "opds",
          data: { connectorId: "connector", entryId: "urn:book:1" },
        },
      }),
    )
  })

  it("finds a folder's collections by its connector and feed", async () => {
    const { ctx, find } = createSyncContext()

    await opdsDataSource.getCollectionCandidatesForItem(
      folderItem(folderLinkData),
      ctx,
    )

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          rx_model: "obokucollection",
          linkType: "opds",
          linkData: {
            connectorId: "connector",
            feedUrl: "https://catalog.example.com/opds/series/1",
          },
        },
      }),
    )
  })

  it("refuses the link data of a folder where a book's is expected", async () => {
    const { ctx } = createSyncContext()

    await expect(
      opdsDataSource.getLinkCandidatesForItem(fileItem(folderLinkData), ctx),
    ).rejects.toThrow("Not the link data of an OPDS book")
    await expect(
      opdsDataSource.download(
        {
          _id: "link",
          _rev: "1-link",
          rxdbMeta: { lwt: 0 },
          rx_model: "link",
          type: "opds",
          book: "book",
          createdAt: "2026-01-01T00:00:00.000Z",
          modifiedAt: null,
          data: folderLinkData,
        },
        { password },
        ctx.db,
      ),
    ).rejects.toThrow("Not the link data of an OPDS book")
  })

  it("answers file metadata from what the last sync saw", async () => {
    const metadata = await opdsDataSource.getFileMetadata({
      link: { type: "opds", data: bookLinkData },
      providerCredentials: { password },
    })

    expect(metadata).toEqual({
      name: "Book 1",
      canDownload: true,
      contentType: "application/epub+zip",
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
      bookMetadata: { size: "1024" },
    })
  })

  it("names a folder after its title", async () => {
    const metadata = await opdsDataSource.getFolderMetadata({
      link: { type: "opds", data: folderLinkData },
      providerCredentials: { password },
    })

    expect(metadata).toEqual({ name: "Series 1" })
  })
})
