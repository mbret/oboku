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
vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

import { useSyncReports } from "./useSyncReports"

type SyncReportEntries = NonNullable<ReturnType<typeof useSyncReports>["data"]>

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
    vi.clearAllMocks()
  })

  it("uses fetchOrThrow so HTTP failures reject the query", async () => {
    httpClientFetchOrThrow.mockResolvedValue({
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

    useSyncReports()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<SyncReportEntries>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    const result = await options.queryFn()

    expect(httpClientFetchOrThrow).toHaveBeenCalledWith(
      "https://api.example.com/datasources/sync-reports",
    )
    expect(httpClientFetch).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]?.book.added).toBe(1)
    expect(result[0]?.book.fetchedMetadata).toBe(1)
  })

  it("ignores report models outside the seeded set instead of crashing", async () => {
    httpClientFetchOrThrow.mockResolvedValue({
      data: [
        {
          created_at: "2026-04-06T19:00:00.000Z",
          ended_at: "2026-04-06T19:01:00.000Z",
          report: [
            {
              rx_model: "secret",
              added: true,
              deleted: false,
              updated: false,
              fetchedMetadata: true,
            },
          ],
        },
      ],
    })

    useSyncReports()

    const options = useQuery.mock.calls[0]?.[0]

    if (!hasQueryFn<SyncReportEntries>(options)) {
      throw new Error("Expected useQuery to be called with a queryFn")
    }

    const result = await options.queryFn()

    expect(result).toHaveLength(1)
    expect(result[0]?.book.added).toBe(0)
  })
})
