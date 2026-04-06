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

describe("useSyncReports", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("uses fetchOrThrow so HTTP failures reject the query", async () => {
    const fetch = vi.fn()
    const fetchOrThrow = vi.fn().mockResolvedValue({
      data: [
        {
          created_at: "2026-04-06T19:00:00.000Z",
          ended_at: "2026-04-06T19:01:00.000Z",
          report: [
            {
              rx_model: "book",
              added: true,
              deleted: false,
              updated: false,
              fetchedMetadata: true,
            },
          ],
        },
      ],
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
    vi.doMock("@tanstack/react-query", () => ({
      useQuery,
    }))

    const { useSyncReports } = await import("./useSyncReports")
    type SyncReportEntries = NonNullable<
      ReturnType<typeof useSyncReports>["data"]
    >

    useSyncReports()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<SyncReportEntries>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    const result = await options.queryFn()

    expect(fetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/datasources/sync-reports",
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]?.book.added).toBe(1)
    expect(result[0]?.book.fetchedMetadata).toBe(1)
  })
})
