import { buildDriveItemUrl } from "@oboku/shared"
import { downloadOneDriveDriveItem, getOneDriveDriveItem } from "./graph"

describe("OneDrive Graph helpers", () => {
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

  it("retrieves OneDrive drive item metadata from Microsoft Graph", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          "@microsoft.graph.downloadUrl": "https://download.example/book.epub",
          file: { mimeType: "application/epub+zip" },
          lastModifiedDateTime: "2026-04-12T08:00:00.000Z",
          name: "Book.epub",
          size: 42,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    )

    await expect(
      getOneDriveDriveItem({
        accessToken: "graph-token",
        driveId: "drive-id",
        fileId: "file-id",
      }),
    ).resolves.toEqual({
      "@microsoft.graph.downloadUrl": "https://download.example/book.epub",
      file: { mimeType: "application/epub+zip" },
      lastModifiedDateTime: "2026-04-12T08:00:00.000Z",
      name: "Book.epub",
      size: 42,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      buildDriveItemUrl("drive-id", "file-id"),
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })

  it("downloads the pre-authenticated stream returned by Microsoft Graph", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]))
        controller.close()
      },
    })

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "@microsoft.graph.downloadUrl":
              "https://download.example/book.epub",
            name: "Book.epub",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(stream, {
          status: 200,
        }),
      )

    const result = await downloadOneDriveDriveItem({
      accessToken: "graph-token",
      driveId: "drive-id",
      fileId: "file-id",
    })

    expect(result.item.name).toBe("Book.epub")
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      buildDriveItemUrl("drive-id", "file-id"),
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://download.example/book.epub",
    )
  })
})
