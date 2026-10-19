import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "@/config"
import { authState } from "./states"
import { useLogin } from "./useLogin"

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const QueryClientWrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

const renderLogin = () =>
  renderHook(() => useLogin(), { wrapper: QueryClientWrapper })

describe("useLogin", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    authState.update({ access_token: null, refresh_token: null })
  })

  it("signs in without an access token and stores the tokens", async () => {
    const requests: Request[] = []

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        requests.push(new Request(input))

        return createJsonResponse(
          { access_token: "access-1", refresh_token: "refresh-1" },
          201,
        )
      }),
    )

    const { result } = renderLogin()

    result.current.mutate({ login: "admin", password: "secret" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe(`${config.apiUrl}/admin/signin`)
    expect(requests[0]?.headers.get("Authorization")).toBeNull()
    expect(await requests[0]?.json()).toEqual({
      login: "admin",
      password: "secret",
    })
    expect(authState.value).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
    })
  })

  it.each([
    [
      "rejected credentials",
      () =>
        createJsonResponse({ message: "Unauthorized", statusCode: 401 }, 401),
      "Invalid login or password",
    ],
    [
      "a server error",
      () =>
        createJsonResponse(
          { message: "Internal server error", statusCode: 500 },
          500,
        ),
      "Unable to sign in",
    ],
    [
      "a response without tokens",
      () => createJsonResponse({}, 201),
      "Unable to sign in",
    ],
  ])(
    "fails with its own message on %s",
    async (_case, createResponse, message) => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>(async () => createResponse()),
      )

      const { result } = renderLogin()

      result.current.mutate({ login: "admin", password: "secret" })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe(message)
    },
  )

  it("fails with the browser's error when the API cannot be reached", async () => {
    const networkError = new TypeError("Failed to fetch")

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(networkError),
    )

    const { result } = renderLogin()

    result.current.mutate({ login: "admin", password: "secret" })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(networkError)
  })
})
