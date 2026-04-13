import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  ONE_DRIVE_CONSUMER_AUTHORITY,
  PICKER_CONSUMER_SCOPES,
  ONE_DRIVE_GRAPH_SCOPES,
} from "../constants"

describe("requestPickerAccessTokenForResource", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("uses the default Microsoft Graph flow for graph resources", async () => {
    const requestMicrosoftAccessToken = vi.fn(async () => ({
      accessToken: "graph-token",
    }))

    vi.doMock("../auth/auth", () => ({
      requestMicrosoftAccessToken,
    }))

    const { requestPickerAccessTokenForResource } = await import("./picker")

    await expect(
      requestPickerAccessTokenForResource({
        requestPopup: undefined,
        resource: "https://graph.microsoft.com/v1.0",
      }),
    ).resolves.toBe("graph-token")

    expect(requestMicrosoftAccessToken).toHaveBeenCalledWith({
      requestPopup: undefined,
      scopes: ONE_DRIVE_GRAPH_SCOPES,
    })
  })

  it("uses consumer authority and scopes for personal OneDrive resources", async () => {
    const requestMicrosoftAccessToken = vi.fn(async () => ({
      accessToken: "consumer-token",
    }))

    vi.doMock("../auth/auth", () => ({
      requestMicrosoftAccessToken,
    }))

    const { requestPickerAccessTokenForResource } = await import("./picker")

    await expect(
      requestPickerAccessTokenForResource({
        requestPopup: undefined,
        resource: "https://my.microsoftpersonalcontent.com",
      }),
    ).resolves.toBe("consumer-token")

    expect(requestMicrosoftAccessToken).toHaveBeenCalledWith({
      authority: ONE_DRIVE_CONSUMER_AUTHORITY,
      requestPopup: undefined,
      scopes: PICKER_CONSUMER_SCOPES,
    })
  })

  it("requests resource-specific scopes for SharePoint-backed OneDrive", async () => {
    const requestMicrosoftAccessToken = vi.fn(async () => ({
      accessToken: "sharepoint-token",
    }))

    vi.doMock("../auth/auth", () => ({
      requestMicrosoftAccessToken,
    }))

    const { requestPickerAccessTokenForResource } = await import("./picker")

    await expect(
      requestPickerAccessTokenForResource({
        requestPopup: undefined,
        resource:
          "https://contoso-my.sharepoint.com/personal/reader_contoso_com",
      }),
    ).resolves.toBe("sharepoint-token")

    expect(requestMicrosoftAccessToken).toHaveBeenCalledWith({
      requestPopup: undefined,
      scopes: [
        "https://contoso-my.sharepoint.com/personal/reader_contoso_com/.default",
      ],
    })
  })
})
