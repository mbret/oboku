import { buildDriveItemUrl } from "@oboku/shared"
import { getSynchronizeAbleDataSourceFromItems } from "./sync"

describe("OneDrive sync", () => {
  const originalFetch = global.fetch
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.resetAllMocks()
  })

  it("builds the same tree structure Google Drive sync expects", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "folder-id",
            name: "Folder",
            folder: {},
            lastModifiedDateTime: "2026-04-13T08:00:00.000Z",
            parentReference: {
              driveId: "drive-id",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "file-id",
            name: "Book.epub",
            file: { mimeType: "application/epub+zip" },
            lastModifiedDateTime: "2026-04-13T08:05:00.000Z",
            parentReference: {
              driveId: "drive-id",
              id: "folder-id",
            },
          }),
          { status: 200 },
        ),
      )

    await expect(
      getSynchronizeAbleDataSourceFromItems({
        accessToken: "graph-token",
        items: [
          { driveId: "drive-id", fileId: "folder-id" },
          { driveId: "drive-id", fileId: "file-id" },
        ],
      }),
    ).resolves.toEqual({
      items: [
        {
          type: "folder",
          linkData: { driveId: "drive-id", fileId: "folder-id" },
          name: "Folder",
          modifiedAt: "2026-04-13T08:00:00.000Z",
          items: [
            {
              type: "file",
              linkData: { driveId: "drive-id", fileId: "file-id" },
              name: "Book.epub",
              modifiedAt: "2026-04-13T08:05:00.000Z",
            },
          ],
        },
      ],
    })

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `${buildDriveItemUrl("drive-id", "folder-id")}?$select=id,name,lastModifiedDateTime,parentReference,file,folder,package`,
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `${buildDriveItemUrl("drive-id", "file-id")}?$select=id,name,lastModifiedDateTime,parentReference,file,folder,package`,
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })
})
