import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  ONE_DRIVE_CONSUMER_PICKER_BASE_URL,
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
      interaction: "allow-interactive",
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
      interaction: "allow-interactive",
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
      interaction: "allow-interactive",
      requestPopup: undefined,
      scopes: [
        "https://contoso-my.sharepoint.com/personal/reader_contoso_com/.default",
      ],
    })
  })

  it("builds picker options for mixed file and folder synchronization", async () => {
    const { buildPickerOptions } = await import("./picker")
    const fileFilters = [".epub", ".pdf"]

    expect(
      buildPickerOptions({
        channelId: "channel-id",
        fileFilters,
        origin: "https://app.oboku.me",
        pickLabel: "Add items",
        selectionMode: "all",
        selectionPersistence: true,
      }),
    ).toMatchObject({
      commands: {
        close: { label: "Cancel" },
        pick: { action: "select", label: "Add items" },
      },
      messaging: {
        channelId: "channel-id",
        origin: "https://app.oboku.me",
      },
      selection: {
        mode: "multiple",
        enablePersistence: true,
      },
      typesAndSources: {
        filters: fileFilters,
        mode: "all",
      },
    })
  })
})

describe("requestOneDrivePickerLaunchData", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("uses the consumer picker bootstrap for personal accounts", async () => {
    const requestMicrosoftAccessToken = vi
      .fn()
      .mockResolvedValueOnce({
        accessToken: "graph-token",
        account: {
          homeAccountId: "user.9188040d-6c67-4c5b-b112-36a304b66dad",
          tenantId: "9188040d-6c67-4c5b-b112-36a304b66dad",
        },
      })
      .mockResolvedValueOnce({
        accessToken: "consumer-picker-token",
      })

    vi.doMock("../auth/auth", () => ({
      requestMicrosoftAccessToken,
    }))

    const { requestOneDrivePickerLaunchData } = await import("./picker")

    await expect(
      requestOneDrivePickerLaunchData({
        requestPopup: undefined,
      }),
    ).resolves.toEqual({
      initialPickerAccessToken: "consumer-picker-token",
      pickerBaseUrl: ONE_DRIVE_CONSUMER_PICKER_BASE_URL,
    })

    expect(requestMicrosoftAccessToken).toHaveBeenNthCalledWith(1, {
      interaction: "allow-interactive",
      requestPopup: undefined,
      scopes: ONE_DRIVE_GRAPH_SCOPES,
    })
    expect(requestMicrosoftAccessToken).toHaveBeenNthCalledWith(2, {
      authority: ONE_DRIVE_CONSUMER_AUTHORITY,
      interaction: "allow-interactive",
      requestPopup: undefined,
      scopes: PICKER_CONSUMER_SCOPES,
    })
  })

  it("discovers the business picker base URL and requests a resource token", async () => {
    const requestMicrosoftAccessToken = vi
      .fn()
      .mockResolvedValueOnce({
        accessToken: "graph-token",
        account: {
          homeAccountId: "user.tenant-id",
          tenantId: "tenant-id",
        },
      })
      .mockResolvedValueOnce({
        accessToken: "sharepoint-picker-token",
      })
    const getOneDrivePickerBaseUrl = vi.fn(async () => {
      return "https://contoso-my.sharepoint.com/personal/reader_contoso_com"
    })

    vi.doMock("../auth/auth", () => ({
      requestMicrosoftAccessToken,
    }))
    vi.doMock("../graph", () => ({
      getOneDrivePickerBaseUrl,
    }))

    const { requestOneDrivePickerLaunchData } = await import("./picker")

    await expect(
      requestOneDrivePickerLaunchData({
        requestPopup: undefined,
      }),
    ).resolves.toEqual({
      initialPickerAccessToken: "sharepoint-picker-token",
      pickerBaseUrl:
        "https://contoso-my.sharepoint.com/personal/reader_contoso_com",
    })

    expect(getOneDrivePickerBaseUrl).toHaveBeenCalledWith("graph-token")
    expect(requestMicrosoftAccessToken).toHaveBeenNthCalledWith(1, {
      interaction: "allow-interactive",
      requestPopup: undefined,
      scopes: ONE_DRIVE_GRAPH_SCOPES,
    })
    expect(requestMicrosoftAccessToken).toHaveBeenNthCalledWith(2, {
      interaction: "allow-interactive",
      requestPopup: undefined,
      scopes: [
        "https://contoso-my.sharepoint.com/personal/reader_contoso_com/.default",
      ],
    })
  })
})
