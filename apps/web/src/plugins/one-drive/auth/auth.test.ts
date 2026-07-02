import { beforeEach, describe, expect, it, vi } from "vitest"
import { ONE_DRIVE_GRAPH_SCOPES } from "../constants"

const CLIENT_ID = "reader-client-id"
const AUTHORITY = "https://login.microsoftonline.com/common"

function createOneDriveAuthTestContext({
  initialAccount,
}: {
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
  }
}

async function importAuthWithSession() {
  const auth = await import("./auth")

  await auth.initializeOneDriveSession({
    clientId: CLIENT_ID,
    authority: AUTHORITY,
  })

  return auth
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

    const { requestMicrosoftAccessToken } = await importAuthWithSession()

    await requestMicrosoftAccessToken({
      authority: "https://login.microsoftonline.com/consumers",
      scopes: ["OneDrive.ReadOnly"],
    })

    expect(client.acquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "https://login.microsoftonline.com/consumers",
        scopes: ["OneDrive.ReadOnly"],
      }),
    )
  })

  it("supports interactive-only token requests without reselecting the account", async () => {
    const { account, client } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
    })

    client.acquireTokenPopup.mockResolvedValueOnce({
      accessToken: "interactive-token",
      account,
      expiresOn: new Date("2026-04-10T10:15:00.000Z"),
    })

    const { requestMicrosoftAccessToken } = await importAuthWithSession()

    await expect(
      requestMicrosoftAccessToken({
        interaction: "interactive-only",
        scopes: ["Files.Read"],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: "interactive-token",
      }),
    )

    expect(client.acquireTokenSilent).not.toHaveBeenCalled()
    expect(client.acquireTokenPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        authority: undefined,
        scopes: ["Files.Read"],
      }),
    )
    expect(client.loginPopup).not.toHaveBeenCalled()
  })

  it("maps graph auth into OneDrive provider credentials", async () => {
    const { account, client } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
    })

    const expiresOn = new Date(Date.now() + 10 * 60 * 1000)

    client.acquireTokenSilent.mockResolvedValueOnce({
      accessToken: "graph-token",
      account,
      expiresOn,
    })

    const { requestOneDriveProviderCredentials } = await importAuthWithSession()

    await expect(requestOneDriveProviderCredentials()).resolves.toEqual({
      accessToken: "graph-token",
      expiresAt: expiresOn.getTime(),
    })

    expect(client.acquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: ONE_DRIVE_GRAPH_SCOPES,
      }),
    )
  })

  it("forces a silent refresh when the cached token has less than five minutes left", async () => {
    const { account, client } = createOneDriveAuthTestContext({
      initialAccount: {
        homeAccountId: "reader.contoso-tenant-id",
        name: "Reader",
        tenantId: "contoso-tenant-id",
        username: "reader@example.com",
      },
    })

    client.acquireTokenSilent
      .mockResolvedValueOnce({
        accessToken: "stale-token",
        account,
        expiresOn: new Date(Date.now() + 2 * 60 * 1000),
      })
      .mockResolvedValueOnce({
        accessToken: "fresh-token",
        account,
        expiresOn: new Date(Date.now() + 10 * 60 * 1000),
      })

    const { requestMicrosoftAccessToken } = await importAuthWithSession()

    await expect(
      requestMicrosoftAccessToken({
        minimumValidityMs: 5 * 60 * 1000,
        scopes: ["Files.Read"],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: "fresh-token",
      }),
    )

    expect(client.acquireTokenSilent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        forceRefresh: false,
        scopes: ["Files.Read"],
      }),
    )
    expect(client.acquireTokenSilent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        forceRefresh: true,
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

    const { requestMicrosoftAccessToken } = await importAuthWithSession()

    await expect(
      requestMicrosoftAccessToken({
        interaction: "interactive-only",
        scopes: ["Files.Read"],
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
        importAuthWithSession(),
        import("../../../errors/errors.shared"),
      ])

    await expect(
      requestMicrosoftAccessToken({
        interaction: "interactive-only",
        scopes: ["Files.Read"],
      }),
    ).rejects.toBeInstanceOf(CancelError)
  })

  it("returns CancelError for silent-only requests when interaction is required", async () => {
    const { client } = createOneDriveAuthTestContext({
      initialAccount: null,
    })

    const { InteractionRequiredAuthError } = await import("@azure/msal-browser")

    client.acquireTokenSilent.mockRejectedValueOnce(
      new InteractionRequiredAuthError(),
    )

    const [{ requestMicrosoftAccessToken }, { CancelError }] =
      await Promise.all([
        importAuthWithSession(),
        import("../../../errors/errors.shared"),
      ])

    await expect(
      requestMicrosoftAccessToken({
        interaction: "silent-only",
        scopes: ["Files.Read"],
      }),
    ).rejects.toBeInstanceOf(CancelError)

    expect(client.loginPopup).not.toHaveBeenCalled()
    expect(client.acquireTokenPopup).not.toHaveBeenCalled()
  })

  it("detects Microsoft consumer accounts from tenant metadata", async () => {
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
    })

    const { initializeOneDriveSession } = await import("./auth")

    await expect(
      initializeOneDriveSession({ clientId: "", authority: AUTHORITY }),
    ).resolves.toBeUndefined()

    expect(publicClientApplication).not.toHaveBeenCalled()
  })

  it("rejects with an error when multiple cached accounts exist and none is active", async () => {
    const ctx = createOneDriveAuthTestContext({
      initialAccount: null,
    })

    const { initializeOneDriveSession, requestMicrosoftAccessToken } =
      await import("./auth")

    await initializeOneDriveSession({
      clientId: CLIENT_ID,
      authority: AUTHORITY,
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

    await expect(
      requestMicrosoftAccessToken({
        scopes: ["Files.Read"],
      }),
    ).rejects.toThrow(
      "Multiple Microsoft accounts were found. Please clear the OneDrive session from the plugin settings and sign in again.",
    )

    expect(ctx.client.acquireTokenSilent).not.toHaveBeenCalled()
    expect(ctx.client.loginPopup).not.toHaveBeenCalled()
  })

  it("initializes the client only once the session is configured", async () => {
    const { account, client, publicClientApplication } =
      createOneDriveAuthTestContext({
        initialAccount: {
          homeAccountId: "reader.contoso-tenant-id",
          name: "Reader",
          tenantId: "contoso-tenant-id",
          username: "reader@example.com",
        },
      })

    const { initializeOneDriveSession, requestMicrosoftAccessToken } =
      await import("./auth")

    await expect(
      requestMicrosoftAccessToken({
        scopes: ["Files.Read"],
      }),
    ).rejects.toThrow(
      "OneDrive is not configured. Register the application client ID in admin first.",
    )

    await initializeOneDriveSession({
      clientId: CLIENT_ID,
      authority: AUTHORITY,
    })

    client.acquireTokenSilent.mockResolvedValueOnce({
      accessToken: "graph-token",
      account,
      expiresOn: new Date("2026-04-10T10:15:00.000Z"),
    })

    await expect(
      requestMicrosoftAccessToken({
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
