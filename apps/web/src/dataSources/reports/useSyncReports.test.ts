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
vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})
vi.mock("reactjrx", async function mockSignalValue(importOriginal) {
  return {
    ...(await importOriginal<typeof import("reactjrx")>()),
    useSignalValue: () => undefined,
  }
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

const createJsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  })

const getQueryFn = () => {
  useSyncReports()

  const options = useQuery.mock.calls[0]?.[0]

  if (!hasQueryFn<SyncReportEntries>(options)) {
    throw new Error("Expected useQuery to be called with a queryFn")
  }

  return options.queryFn
}

describe("useSyncReports", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("counts the entries of the fetched sync reports", async () => {
    sdkFetch.mockResolvedValue(
      createJsonResponse([
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
      ]),
    )

    const result = await getQueryFn()()

    const [request] = sdkFetch.mock.calls[0] ?? []

    expect(request instanceof Request ? request.url : String(request)).toBe(
      "https://api.example.com/datasources/sync-reports",
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.book.added).toBe(1)
    expect(result[0]?.book.fetchedMetadata).toBe(1)
  })

  it("rejects the query when the request fails", async () => {
    sdkFetch.mockResolvedValue(new Response("boom", { status: 500 }))

    await expect(getQueryFn()()).rejects.toBeDefined()
  })

  it("ignores report models outside the seeded set instead of crashing", async () => {
    sdkFetch.mockResolvedValue(
      createJsonResponse([
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
      ]),
    )

    const result = await getQueryFn()()

    expect(result).toHaveLength(1)
    expect(result[0]?.book.added).toBe(0)
  })
})
