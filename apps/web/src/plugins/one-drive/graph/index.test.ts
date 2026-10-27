import { Observable } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { httpClientWeb } from "../../../http/httpClient.web"
import { ONE_DRIVE_CONSUMER_PICKER_BASE_URL } from "../constants"
import {
  getOneDriveItemSummary,
  getOneDrivePickerBaseUrl,
  updateOneDriveDriveItemContent,
} from "./index"

describe("getOneDrivePickerBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
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

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-id/items/file-id?%24select=id%2Cname%2CparentReference%2Cfile%2Cfolder%2Cpackage",
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })

  it("updates drive item content through Microsoft Graph", () => {
    const uploadResult$ = new Observable<never>()
    const upload$ = vi
      .spyOn(httpClientWeb, "upload$")
      .mockReturnValue(uploadResult$)
    const file = new File(["contents"], "Book.epub", {
      type: "application/epub+zip",
    })
    const onProgress = vi.fn()

    expect(
      updateOneDriveDriveItemContent({
        accessToken: "graph-token",
        driveId: "drive/id",
        file,
        fileId: "file id",
        onProgress,
      }),
    ).toBe(uploadResult$)

    expect(upload$).toHaveBeenCalledWith({
      url: "https://graph.microsoft.com/v1.0/drives/drive%2Fid/items/file%20id/content",
      method: "PUT",
      headers: {
        Authorization: "Bearer graph-token",
        "Content-Type": "application/epub+zip",
      },
      body: file,
      onUploadProgress: expect.any(Function),
    })

    const [uploadRequest] = upload$.mock.calls[0] ?? []

    uploadRequest?.onUploadProgress?.(
      new ProgressEvent("progress", {
        lengthComputable: true,
        loaded: 1,
        total: 4,
      }),
    )

    expect(onProgress).toHaveBeenCalledWith(0.25)
  })
})
