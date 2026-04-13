import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ONE_DRIVE_CONSUMER_PICKER_BASE_URL } from "../constants"

describe("getOneDrivePickerBaseUrl", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns the consumer picker for personal drives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              driveType: "personal",
              webUrl: "https://onedrive.live.com/?id=root",
            }),
            { status: 200 },
          ),
      ),
    )

    const { getOneDrivePickerBaseUrl } = await import("./index")

    await expect(getOneDrivePickerBaseUrl("graph-token")).resolves.toBe(
      ONE_DRIVE_CONSUMER_PICKER_BASE_URL,
    )
  })

  it("returns the SharePoint host for business drives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              driveType: "business",
              webUrl:
                "https://contoso-my.sharepoint.com/personal/reader_contoso_com/Documents",
            }),
            { status: 200 },
          ),
      ),
    )

    const { getOneDrivePickerBaseUrl } = await import("./index")

    await expect(getOneDrivePickerBaseUrl("graph-token")).resolves.toBe(
      "https://contoso-my.sharepoint.com/personal/reader_contoso_com",
    )
  })

  it("throws when Microsoft Graph does not return enough drive metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              driveType: "business",
            }),
            { status: 200 },
          ),
      ),
    )

    const { getOneDrivePickerBaseUrl } = await import("./index")

    await expect(getOneDrivePickerBaseUrl("graph-token")).rejects.toThrow(
      "OneDrive did not return a supported picker base URL.",
    )
  })

  it("fetches item summaries with the expected selected fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: "file-id",
              name: "Book.epub",
            }),
            { status: 200 },
          ),
      ),
    )

    const { getOneDriveItemSummary } = await import("./index")

    await expect(
      getOneDriveItemSummary({
        accessToken: "graph-token",
        driveId: "drive-id",
        fileId: "file-id",
      }),
    ).resolves.toEqual({
      id: "file-id",
      name: "Book.epub",
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-id/items/file-id?%24select=id%2Cname%2CparentReference%2Cfile%2Cfolder%2Cpackage",
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })
})
