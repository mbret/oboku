import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  adminGetTokenStats,
  adminSendEmail,
  ObokuErrorCode,
} from "@oboku/shared"
import { config } from "@/config"
import { apiClient } from "./apiClient"
import { authState } from "./states"

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

describe("apiClient", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    authState.update({ access_token: "access-1", refresh_token: "refresh-1" })
  })

  it("sends the access token and resolves with the parsed body", async () => {
    const requests: Request[] = []

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        requests.push(new Request(input))

        return createJsonResponse({ totalTokens: 3 })
      }),
    )

    const { data } = await adminGetTokenStats({ client: apiClient })

    expect(data).toEqual({ totalTokens: 3 })
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url).toBe(`${config.apiUrl}/admin/tokens/stats`)
    expect(requests[0]?.headers.get("Authorization")).toBe("Bearer access-1")
  })

  it("refreshes the token once for concurrent 401s and replays each request with its body", async () => {
    const refreshRequests: Request[] = []
    const emailRequests: Request[] = []

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const request = new Request(input)

        if (request.url === `${config.apiUrl}/admin/refresh`) {
          refreshRequests.push(request)

          return createJsonResponse(
            { access_token: "access-2", refresh_token: "refresh-2" },
            201,
          )
        }

        emailRequests.push(request)

        return request.headers.get("Authorization") === "Bearer access-2"
          ? createJsonResponse({ recipientCount: 2 }, 201)
          : new Response(null, { status: 401 })
      }),
    )

    const body = { audienceType: "all" as const, subject: "Hi", body: "Hello" }
    const results = await Promise.all([
      adminSendEmail({ client: apiClient, body }),
      adminSendEmail({ client: apiClient, body }),
    ])

    expect(results.map(({ data }) => data)).toEqual([
      { recipientCount: 2 },
      { recipientCount: 2 },
    ])
    expect(refreshRequests).toHaveLength(1)
    expect(refreshRequests[0]?.headers.get("Authorization")).toBeNull()
    expect(await refreshRequests[0]?.json()).toEqual({
      refresh_token: "refresh-1",
    })
    expect(emailRequests).toHaveLength(4)

    for (const request of emailRequests) {
      expect(await request.json()).toEqual(body)
    }

    expect(authState.value).toEqual({
      access_token: "access-2",
      refresh_token: "refresh-2",
    })
    expect(localStorage.getItem("oboku-admin-refresh-token")).toBe("refresh-2")
  })

  it("signs the admin out when the refresh is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response(null, { status: 401 })),
    )

    await expect(adminGetTokenStats({ client: apiClient })).rejects.toThrow(
      "Session expired",
    )
    expect(authState.value).toEqual({
      access_token: null,
      refresh_token: null,
    })
  })

  it.each([
    [
      "the API's message",
      createJsonResponse(
        {
          message: "Subject is required",
          error: "Bad Request",
          statusCode: 400,
        },
        400,
      ),
      "Subject is required",
    ],
    [
      "the API's validation messages",
      createJsonResponse(
        {
          message: ["a is empty", "b is empty"],
          error: "Bad Request",
          statusCode: 400,
        },
        400,
      ),
      "a is empty, b is empty",
    ],
    [
      "the message of an oboku error code",
      createJsonResponse(
        {
          errors: [{ code: ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS }],
        },
        400,
      ),
      "An account already exists for this email.",
    ],
    [
      "an oboku error code the admin app has no message for",
      createJsonResponse(
        { errors: [{ code: ObokuErrorCode.ERROR_MAGIC_LINK_INVALID }] },
        400,
      ),
      `Request failed with error code ${ObokuErrorCode.ERROR_MAGIC_LINK_INVALID}`,
    ],
    [
      "the status text of an empty body",
      new Response(null, { status: 502, statusText: "Bad Gateway" }),
      "Bad Gateway",
    ],
    [
      "the status of an empty body without status text",
      new Response(null, { status: 502 }),
      "Request failed with status 502",
    ],
  ])("fails with %s", async (_case, response, message) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response))

    await expect(adminGetTokenStats({ client: apiClient })).rejects.toThrow(
      new Error(message),
    )
  })
})
