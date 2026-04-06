import { beforeEach, describe, expect, it, vi } from "vitest"

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

    const query = useInboxNotifications()

    await expect(query.queryFn()).resolves.toEqual([{ id: 1 }])
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

    const query = useUnreadNotificationsCount()

    await expect(query.queryFn()).resolves.toEqual({ count: 3 })
    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/notifications/unread-count",
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(query.unreadCount).toBe(0)
  })
})
