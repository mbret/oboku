import { beforeEach, describe, expect, it, vi } from "vitest"

const { httpClientFetch, httpClientFetchOrThrow, useQuery } = vi.hoisted(
  function createQueryMocks() {
    return {
      httpClientFetch: vi.fn(),
      httpClientFetchOrThrow: vi.fn(),
      useQuery: vi.fn((options) => options),
    }
  },
)

vi.mock(
  "../../http/HttpClientApiContext",
  async function mockHttpClientApi(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../http/HttpClientApiContext")
      >()),
      useHttpClientApi: () => ({
        fetch: httpClientFetch,
        fetchOrThrow: httpClientFetchOrThrow,
      }),
    }
  },
)
vi.mock("../../config/useConfig", async function mockConfig(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../../config/useConfig")>()),
    useConfig: () => ({ data: { API_URL: "https://api.example.com" } }),
  }
})
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

  it("uses fetchOrThrow for inbox notifications", async () => {
    httpClientFetchOrThrow.mockResolvedValue({
      data: [{ id: 1 }],
    })

    useInboxNotifications()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<InboxNotifications>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual([{ id: 1 }])
    expect(httpClientFetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/notifications",
    )
    expect(httpClientFetch).not.toHaveBeenCalled()
  })

  it("uses fetchOrThrow for unread count", async () => {
    httpClientFetchOrThrow.mockResolvedValue({
      data: { count: 3 },
    })

    const query = useUnreadNotificationsCount()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<UnreadNotificationsCount>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual({ count: 3 })
    expect(httpClientFetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/notifications/unread-count",
    )
    expect(httpClientFetch).not.toHaveBeenCalled()
    expect(query.unreadCount).toBe(0)
  })
})
