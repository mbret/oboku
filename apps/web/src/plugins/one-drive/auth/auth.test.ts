import { beforeEach, describe, expect, it, vi } from "vitest"

function createOneDriveAuthTestContext({
  initialClientId = "reader-client-id",
  initialAccount,
}: {
  initialClientId?: string
  initialAccount: {
    homeAccountId: string
    name: string
    tenantId: string
    username: string
  } | null
}) {
  const account = initialAccount ?? {
    homeAccountId: "reader.contoso-tenant-id",
    name: "Reader",
    tenantId: "contoso-tenant-id",
    username: "reader@example.com",
  }

  let activeAccount = initialAccount
  let microsoftApplicationClientId: string | undefined = initialClientId

  const client = {
    acquireTokenPopup: vi.fn(),
    acquireTokenSilent: vi.fn(),
    addEventCallback: vi.fn(),
    clearCache: vi.fn(async () => undefined),
    getActiveAccount: vi.fn(() => activeAccount),
    getAllAccounts: vi.fn(() => (activeAccount ? [activeAccount] : [])),
    handleRedirectPromise: vi.fn(async () => null),
    initialize: vi.fn(async () => undefined),
    loginPopup: vi.fn(),
    setActiveAccount: vi.fn((nextAccount) => {
      activeAccount = nextAccount
    }),
  }

  const publicClientApplication = vi.fn(function PublicClientApplication() {
    return client
  })

  vi.doMock("../../../config/configuration", () => ({
    configuration: {
      get FEATURE_ONE_DRIVE_ENABLED() {
        return !!microsoftApplicationClientId
      },
      MICROSOFT_APPLICATION_AUTHORITY:
        "https://login.microsoftonline.com/common",
      get MICROSOFT_APPLICATION_CLIENT_ID() {
        return microsoftApplicationClientId
      },
    },
  }))

  vi.doMock("@azure/msal-browser", () => ({
    BrowserAuthErrorCodes: {
      interactionInProgress: "interaction_in_progress",
      interactionInProgressCancelled: "interaction_in_progress_cancelled",
      popupWindowError: "popup_window_error",
      userCancelled: "user_cancelled",
    },
    BrowserCacheLocation: {
      LocalStorage: "localStorage",
    },
    EventType: {
      ACQUIRE_TOKEN_SUCCESS: "msal:acquireTokenSuccess",
      ACTIVE_ACCOUNT_CHANGED: "msal:activeAccountChanged",
      LOGIN_SUCCESS: "msal:loginSuccess",
      LOGOUT_SUCCESS: "msal:logoutSuccess",
    },
    InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {},
    PublicClientApplication: publicClientApplication,
  }))

  vi.stubGlobal("window", {
    location: {
      origin: "https://reader.example",
    },
  })

  return {
    account,
    client,
    publicClientApplication,
    setMicrosoftApplicationClientId: (nextClientId: string | undefined) => {
      microsoftApplicationClientId = nextClientId
    },
  }
}

describe("OneDrive auth", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("forwards the authority override to token requests", async () => {
    const { account, client } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
    })

    client.acquireTokenSilent.mockResolvedValueOnce({
      accessToken: "consumer-token",
      account,
      expiresOn: new Date("2026-04-10T10:15:00.000Z"),
    })

    const { requestMicrosoftAccessToken } = await import("./auth")

    await requestMicrosoftAccessToken({
      authority: "https://login.microsoftonline.com/consumers",
      requestPopup: undefined,
      scopes: ["OneDrive.ReadOnly"],
    })

    expect(client.acquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "https://login.microsoftonline.com/consumers",
        scopes: ["OneDrive.ReadOnly"],
      }),
    )
  })

  it("skips the silent token path when requested", async () => {
    const { account, client } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
    })

    client.loginPopup.mockResolvedValueOnce({
      accessToken: "interactive-token",
      account,
      expiresOn: new Date("2026-04-10T10:15:00.000Z"),
    })

    const { requestMicrosoftAccessToken } = await import("./auth")

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
        skipSilent: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: "interactive-token",
      }),
    )

    expect(client.acquireTokenSilent).not.toHaveBeenCalled()
    expect(client.loginPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: undefined,
        prompt: "select_account",
        scopes: ["Files.Read"],
      }),
    )
  })

  it("keeps popup window failures as real errors", async () => {
    const { client } = createOneDriveAuthTestContext({
      initialAccount: null,
    })

    client.loginPopup.mockRejectedValueOnce({
      errorCode: "popup_window_error",
    })

    const { requestMicrosoftAccessToken } = await import("./auth")

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
        skipSilent: true,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        errorCode: "popup_window_error",
      }),
    )
  })

  it("still maps user-cancelled popups to CancelError", async () => {
    const { client } = createOneDriveAuthTestContext({
      initialAccount: null,
    })

    client.loginPopup.mockRejectedValueOnce({
      errorCode: "user_cancelled",
    })

    const [{ requestMicrosoftAccessToken }, { CancelError }] =
      await Promise.all([
        import("./auth"),
        import("../../../errors/errors.shared"),
      ])

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
        skipSilent: true,
      }),
    ).rejects.toBeInstanceOf(CancelError)
  })

  it("detects Microsoft consumer accounts from tenant metadata", async () => {
    createOneDriveAuthTestContext({
      initialAccount: null,
    })

    const { isMicrosoftConsumerAccount } = await import("@oboku/shared")

    expect(
      isMicrosoftConsumerAccount({
        homeAccountId: "reader.9188040d-6c67-4c5b-b112-36a304b66dad",
        tenantId: "9188040d-6c67-4c5b-b112-36a304b66dad",
      }),
    ).toBe(true)

    expect(
      isMicrosoftConsumerAccount({
        homeAccountId: "reader.contoso-tenant-id",
        tenantId: "contoso-tenant-id",
      }),
    ).toBe(false)
  })

  it("does not initialize a session when OneDrive is not configured", async () => {
    const { publicClientApplication } = createOneDriveAuthTestContext({
      initialAccount: null,
      initialClientId: "",
    })

    const { initializeOneDriveSession } = await import("./auth")

    await expect(initializeOneDriveSession()).resolves.toBeUndefined()

    expect(publicClientApplication).not.toHaveBeenCalled()
  })

  it("rejects with an error when multiple cached accounts exist and none is active", async () => {
    const ctx = createOneDriveAuthTestContext({
      initialAccount: null,
    })

    ctx.client.getAllAccounts.mockReturnValue([
      {
        homeAccountId: "alice.tenant-a",
        name: "Alice",
        tenantId: "tenant-a",
        username: "alice@example.com",
      },
      {
        homeAccountId: "bob.tenant-b",
        name: "Bob",
        tenantId: "tenant-b",
        username: "bob@example.com",
      },
    ])

    const { requestMicrosoftAccessToken } = await import("./auth")

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
      }),
    ).rejects.toThrow(
      "Multiple Microsoft accounts were found. Please clear the OneDrive session from the plugin settings and sign in again.",
    )

    expect(ctx.client.acquireTokenSilent).not.toHaveBeenCalled()
    expect(ctx.client.loginPopup).not.toHaveBeenCalled()
  })

  it("retries initialization after the client ID becomes available", async () => {
    const {
      account,
      client,
      publicClientApplication,
      setMicrosoftApplicationClientId,
    } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
      initialClientId: "",
    })

    const { requestMicrosoftAccessToken } = await import("./auth")

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
      }),
    ).rejects.toThrow(
      "OneDrive is not configured. Register the application client ID in admin first.",
    )

    setMicrosoftApplicationClientId("reader-client-id")

    client.acquireTokenSilent.mockResolvedValueOnce({
      accessToken: "graph-token",
      account,
      expiresOn: new Date("2026-04-10T10:15:00.000Z"),
    })

    await expect(
      requestMicrosoftAccessToken({
        requestPopup: undefined,
        scopes: ["Files.Read"],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: "graph-token",
      }),
    )

    expect(publicClientApplication).toHaveBeenCalledTimes(1)
  })
})
