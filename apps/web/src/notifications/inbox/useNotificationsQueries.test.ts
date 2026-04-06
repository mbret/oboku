import { beforeEach, describe, expect, it, vi } from "vitest"

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
    vi.resetModules()
  })

  it("uses fetchOrThrow for inbox notifications", async () => {
    const fetch = vi.fn()
    const fetchOrThrow = vi.fn().mockResolvedValue({
      data: [{ id: 1 }],
    })
    const useQuery = vi.fn((options) => options)

    vi.doMock("../../http/httpClientApi.web", () => ({
      httpClientApi: {
        fetch,
        fetchOrThrow,
      },
    }))
    vi.doMock("../../config/configuration", () => ({
      configuration: {
        API_URL: "https://api.example.com",
      },
    }))
    vi.doMock("@tanstack/react-query", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@tanstack/react-query")>()

      return {
        ...actual,
        useQuery,
      }
    })

    const { useInboxNotifications } = await import("./useInboxNotifications")
    type InboxNotifications = NonNullable<
      ReturnType<typeof useInboxNotifications>["data"]
    >

    useInboxNotifications()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<InboxNotifications>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual([{ id: 1 }])
    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/notifications",
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it("uses fetchOrThrow for unread count", async () => {
    const fetch = vi.fn()
    const fetchOrThrow = vi.fn().mockResolvedValue({
      data: { count: 3 },
    })
    const useQuery = vi.fn((options) => options)

    vi.doMock("../../http/httpClientApi.web", () => ({
      httpClientApi: {
        fetch,
        fetchOrThrow,
      },
    }))
    vi.doMock("../../config/configuration", () => ({
      configuration: {
        API_URL: "https://api.example.com",
      },
    }))
    vi.doMock("@tanstack/react-query", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@tanstack/react-query")>()

      return {
        ...actual,
        useQuery,
      }
    })

    const { useUnreadNotificationsCount } = await import(
      "./useUnreadNotificationsCount"
    )
    type UnreadNotificationsCount = NonNullable<
      ReturnType<typeof useUnreadNotificationsCount>["data"]
    >

    const query = useUnreadNotificationsCount()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<UnreadNotificationsCount>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    await expect(options.queryFn()).resolves.toEqual({ count: 3 })
    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/notifications/unread-count",
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(query.unreadCount).toBe(0)
  })
})
