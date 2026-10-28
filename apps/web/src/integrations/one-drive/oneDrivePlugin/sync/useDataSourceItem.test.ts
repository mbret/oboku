import { getOneDriveItemKey, type OneDriveLinkData } from "@oboku/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

const requestMicrosoftAccessToken = vi.fn()
const getOneDriveItemSummary = vi.fn()

vi.mock("../auth/auth", () => ({
  requestMicrosoftAccessToken,
}))

vi.mock("../graph", () => ({
  getOneDriveItemSummary,
}))

describe("resolveOneDriveDataSourceItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requests fresh metadata again after a previous failure", async () => {
    const item: OneDriveLinkData = {
      driveId: "drive-id",
      fileId: "file-id",
    }

    requestMicrosoftAccessToken.mockResolvedValue({
      accessToken: "graph-token",
    })
    getOneDriveItemSummary
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce({
        id: "file-id",
        name: "Book.epub",
        parentReference: {
          driveId: "drive-id",
          id: "folder-id",
        },
      })

    const { resolveOneDriveDataSourceItem } = await import(
      "./useDataSourceItem"
    )

    await expect(resolveOneDriveDataSourceItem(item)).rejects.toThrow(
      "temporary failure",
    )
    await expect(resolveOneDriveDataSourceItem(item)).resolves.toEqual({
      treeItemId: getOneDriveItemKey({
        driveId: "drive-id",
        fileId: "file-id",
      }),
      metadata: {
        id: "file-id",
        name: "Book.epub",
        parentReference: {
          driveId: "drive-id",
          id: "folder-id",
        },
      },
      parentTreeItemId: getOneDriveItemKey({
        driveId: "drive-id",
        fileId: "folder-id",
      }),
    })

    expect(requestMicrosoftAccessToken).toHaveBeenCalledTimes(2)
    expect(getOneDriveItemSummary).toHaveBeenCalledTimes(2)
  })
})
