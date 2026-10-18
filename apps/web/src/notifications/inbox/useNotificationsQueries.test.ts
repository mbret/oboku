import { beforeEach, describe, expect, it, vi } from "vitest"

const { sdkFetch, useQuery } = vi.hoisted(function createQueryMocks() {
  return {
    sdkFetch: vi.fn<typeof fetch>(),
    useQuery: vi.fn((options) => options),
  }
})

vi.mock(
  "../../http/HttpClientApiContext",
  async function mockHttpClientApi(importOriginal) {
    const { createApiClient } = await import("@oboku/shared")
    const sdkClient = createApiClient({
      baseUrl: "https://api.example.com",
      throwOnError: true,
      fetch: sdkFetch,
    })

    return {
      ...(await importOriginal<
        typeof import("../../http/HttpClientApiContext")
      >()),
      useHttpClientApi: () => ({ sdkClient }),
    }
  },
)
vi.mock("@tanstack/react-query", async function mockUseQuery(importOriginal) {
  return {
    ...(await importOriginal<typeof import("@tanstack/react-query")>()),
    useQuery,
  }
})
vi.mock("./useLocalNotifications", function mockLocalNotifications() {
  return { useLocalNotifications: () => [] }
})
vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})
vi.mock("reactjrx", async function mockSignalValue(importOriginal) {
  return {
    ...(await importOriginal<typeof import("reactjrx")>()),
    useSignalValue: () => "reader",
  }
})

import { useInboxNotifications } from "./useInboxNotifications"
import { useUnreadNotificationsCount } from "./useUnreadNotificationsCount"

type InboxNotifications = NonNullable<
  ReturnType<typeof useInboxNotifications>["data"]
>
type UnreadNotificationsCount = NonNullable<
  ReturnType<typeof useUnreadNotificationsCount>["data"]
>

const createJsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  })

const getRequestedUrl = () => {
  const [input] = sdkFetch.mock.calls[0] ?? []

  return input instanceof Request ? input.url : String(input)
}

const hasQueryFn = <Result>(
  value: unknown,
): value is {
  queryFn: () => Promise<Result>
} =>
  typeof value === "object" &&
  value !== null &&
  "queryFn" in value &&
  typeof value.queryFn === "function"

describe("notifications queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches the inbox notifications with the generated client", async () => {
    sdkFetch.mockResolvedValue(createJsonResponse([{ id: 1 }]))

    useInboxNotifications()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<InboxNotifications>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual([{ id: 1 }])
    expect(getRequestedUrl()).toBe("https://api.example.com/notifications")
  })

  it("fetches the unread count with the generated client", async () => {
    sdkFetch.mockResolvedValue(createJsonResponse({ count: 3 }))

    const query = useUnreadNotificationsCount()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<UnreadNotificationsCount>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual({ count: 3 })
    expect(getRequestedUrl()).toBe(
      "https://api.example.com/notifications/unread-count",
    )
    expect(query.unreadCount).toBe(0)
  })
})
