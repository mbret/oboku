import {
  GOOGLE_DRIVE_FILE_SCOPE,
  type GoogleAccessTokenResponseDto,
  ObokuErrorCode,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom, type Subscription } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CancelError } from "../../../../errors/errors.shared"
import { HttpClientApiContext } from "../../../../http"
import type { HttpApiClientWeb } from "../../../../http/HttpClientApi.web"
import { HttpClientError } from "../../../../http/httpClient.shared"
import { toastsSubject } from "../../../../notifications/toasts"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../../../profiles/active/activeProfileId"
import { clearGoogleAccessToken, googleAccessTokenSignal } from "../../auth"
import { createGoogleConnectionQueryOptions } from "../../connection/googleConnectionQueryOptions"
import { useRequestToken } from "./useRequestToken"

const { useConfig, setGapiToken, initTokenClient } = vi.hoisted(
  function createSpies() {
    return {
      useConfig: vi.fn(),
      setGapiToken: vi.fn(),
      initTokenClient: vi.fn(),
    }
  },
)

vi.mock("../../../../config/useConfig", function mockConfig() {
  return { useConfig }
})

vi.mock("./scripts", async function mockGoogleScripts() {
  const { of } = await import("rxjs")
  const scripts = {
    gsi: { accounts: { oauth2: { initTokenClient } } },
    gapi: { client: { setToken: setGapiToken } },
  }

  return {
    useGoogleScripts() {
      return {
        getGoogleScripts() {
          return of(scripts)
        },
      }
    },
  }
})

const PROFILE_ID = "profile"
const DRIVE_SCOPES = [GOOGLE_DRIVE_FILE_SCOPE]
const MINIMUM_TOKEN_VALIDITY_MS = 60_000

const BROWSER_TOKEN_RESPONSE: google.accounts.oauth2.TokenResponse = {
  access_token: "browser-token",
  expires_in: "3599",
  scope: GOOGLE_DRIVE_FILE_SCOPE,
  token_type: "Bearer",
  hd: "",
  prompt: "",
  state: "",
  error: "",
  error_description: "",
  error_uri: "",
}

const createMintedToken = ({
  accessToken = "minted-token",
  expiresIn = 3599,
  scopes = [GOOGLE_DRIVE_FILE_SCOPE, "openid"],
}: Partial<GoogleAccessTokenResponseDto> = {}): GoogleAccessTokenResponseDto => ({
  accessToken,
  expiresIn,
  scopes,
})

const createHttpError = (status: number, data: unknown) =>
  new HttpClientError(
    {
      response: new Response(),
      data,
      status,
      statusText: "",
      headers: {},
      config: {
        input:
          "https://api.example.com/provider-connections/google/access-token",
      },
    },
    undefined,
  )

const createApiError = (code: ObokuErrorCode) =>
  createHttpError(400, { errors: [{ code }] })

const renderRequestToken = ({ mint }: { mint: () => Promise<unknown> }) => {
  const post = vi.fn(mint)
  // test double: the hook only calls the generated client's HTTP methods
  const client = { sdkClient: { post } } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient()
  const requestPopup = vi.fn().mockResolvedValue(true)
  const { result } = renderHook(() => useRequestToken({ requestPopup }), {
    wrapper: function Providers({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <HttpClientApiContext.Provider value={client}>
            {children}
          </HttpClientApiContext.Provider>
        </QueryClientProvider>
      )
    },
  })

  const requestToken = () =>
    firstValueFrom(result.current.requestToken({ scope: DRIVE_SCOPES }))

  return { requestToken, post, requestPopup, queryClient, client }
}

describe("useRequestToken", () => {
  const showToast = vi.fn()
  let toastsSubscription: Subscription

  beforeEach(() => {
    setActiveProfileId(PROFILE_ID)
    toastsSubscription = toastsSubject.subscribe(showToast)
    useConfig.mockReturnValue({
      data: {
        FEATURE_GOOGLE_CONNECTION_ENABLED: true,
        MINIMUM_TOKEN_VALIDITY_MS,
        GOOGLE_CLIENT_ID: "123-oboku.apps.googleusercontent.com",
      },
    })
    initTokenClient.mockImplementation(function createTokenClient(
      config: google.accounts.oauth2.TokenClientConfig,
    ) {
      return {
        requestAccessToken: function grantToken() {
          config.callback(BROWSER_TOKEN_RESPONSE)
        },
      }
    })
  })

  afterEach(() => {
    cleanup()
    toastsSubscription.unsubscribe()
    clearGoogleAccessToken()
    clearActiveProfileId()
    vi.clearAllMocks()
  })

  it("uses the browser's token while it is valid, without asking the API", async () => {
    googleAccessTokenSignal.update({
      ...BROWSER_TOKEN_RESPONSE,
      created_at: Date.now(),
    })
    const { requestToken, post } = renderRequestToken({
      mint: async () => ({ data: createMintedToken() }),
    })

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(post).not.toHaveBeenCalled()
  })

  it("mints a token from the connection instead of opening Google's sign-in", async () => {
    const { requestToken, post, requestPopup } = renderRequestToken({
      mint: async () => ({ data: createMintedToken() }),
    })

    const token = await requestToken()

    expect(token.access_token).toBe("minted-token")
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/provider-connections/google/access-token",
      }),
    )
    expect(setGapiToken).toHaveBeenCalledWith({
      access_token: "minted-token",
    })
    expect(requestPopup).not.toHaveBeenCalled()
    expect(initTokenClient).not.toHaveBeenCalled()
  })

  it("reuses the minted token while it stays valid", async () => {
    const { requestToken, post } = renderRequestToken({
      mint: async () => ({ data: createMintedToken() }),
    })

    await requestToken()
    const secondToken = await requestToken()

    expect(secondToken.access_token).toBe("minted-token")
    expect(post).toHaveBeenCalledTimes(1)
  })

  it("mints another token once the minted one is about to expire", async () => {
    const { requestToken, post } = renderRequestToken({
      mint: async () => ({ data: createMintedToken() }),
    })
    const expiringSoonSeconds = MINIMUM_TOKEN_VALIDITY_MS / 1000 - 1
    post.mockResolvedValueOnce({
      data: createMintedToken({
        accessToken: "expiring-token",
        expiresIn: expiringSoonSeconds,
      }),
    })

    await requestToken()
    const secondToken = await requestToken()

    expect(secondToken.access_token).toBe("minted-token")
    expect(post).toHaveBeenCalledTimes(2)
  })

  it("opens Google's sign-in, without a message, when the user has not connected", async () => {
    const { requestToken, requestPopup, queryClient, client } =
      renderRequestToken({
        mint: () =>
          Promise.reject(
            createApiError(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND),
          ),
      })
    const connectionQueryKey = createGoogleConnectionQueryOptions({
      httpClientApi: client,
      profileId: PROFILE_ID,
    }).queryKey
    queryClient.setQueryData(connectionQueryKey, {
      connection: {
        accountName: "reader@gmail.com",
        connectedAt: "2026-11-11T08:00:00.000Z",
      },
    })

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(requestPopup).toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(connectionQueryKey)).toEqual({
      connection: null,
    })
  })

  it("tells the user a lost connection is gone, then opens Google's sign-in", async () => {
    const { requestToken, queryClient, client } = renderRequestToken({
      mint: () =>
        Promise.reject(
          createApiError(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST),
        ),
    })
    const connectionQueryKey = createGoogleConnectionQueryOptions({
      httpClientApi: client,
      profileId: PROFILE_ID,
    }).queryKey

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Google account disconnected",
        severity: "warning",
      }),
    )
    expect(queryClient.getQueryData(connectionQueryKey)).toEqual({
      connection: null,
    })
  })

  it("opens Google's sign-in when the API cannot mint a token", async () => {
    const { requestToken, requestPopup } = renderRequestToken({
      mint: () =>
        Promise.reject(createHttpError(500, { message: "Server error" })),
    })

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(requestPopup).toHaveBeenCalled()
  })

  it("opens Google's sign-in when the minted token lacks a requested scope", async () => {
    const { requestToken, requestPopup } = renderRequestToken({
      mint: async () => ({ data: createMintedToken({ scopes: ["openid"] }) }),
    })

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(requestPopup).toHaveBeenCalled()
    expect(setGapiToken).not.toHaveBeenCalled()
  })

  it("does not ask the API on an instance that cannot connect Google accounts", async () => {
    useConfig.mockReturnValue({
      data: {
        FEATURE_GOOGLE_CONNECTION_ENABLED: false,
        MINIMUM_TOKEN_VALIDITY_MS,
        GOOGLE_CLIENT_ID: "123-oboku.apps.googleusercontent.com",
      },
    })
    const { requestToken, post } = renderRequestToken({
      mint: async () => ({ data: createMintedToken() }),
    })

    const token = await requestToken()

    expect(token.access_token).toBe("browser-token")
    expect(post).not.toHaveBeenCalled()
  })

  it("drops the minted token when another tab switches profiles meanwhile", async () => {
    const mintResponse = Promise.withResolvers<unknown>()
    const { requestToken, post } = renderRequestToken({
      mint: () => mintResponse.promise,
    })

    const token = requestToken()

    await waitFor(() => {
      expect(post).toHaveBeenCalled()
    })
    setActiveProfileId("other-profile")
    mintResponse.resolve({ data: createMintedToken() })

    await expect(token).rejects.toBeInstanceOf(CancelError)
    expect(googleAccessTokenSignal.getValue()).toBeUndefined()
    expect(setGapiToken).not.toHaveBeenCalled()
  })

  it("keeps quiet about the previous profile's lost connection after a profile switch", async () => {
    const mintResponse = Promise.withResolvers<unknown>()
    const { requestToken, post, requestPopup } = renderRequestToken({
      mint: () => mintResponse.promise,
    })

    const token = requestToken()

    await waitFor(() => {
      expect(post).toHaveBeenCalled()
    })
    setActiveProfileId("other-profile")
    mintResponse.reject(
      createApiError(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST),
    )

    await expect(token).rejects.toBeInstanceOf(CancelError)
    expect(showToast).not.toHaveBeenCalled()
    expect(requestPopup).not.toHaveBeenCalled()
  })
})
