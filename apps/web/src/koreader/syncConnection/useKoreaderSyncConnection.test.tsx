import type { KoreaderSyncConnectionDto } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../profiles/active/activeProfileId"
import { useKoreaderSyncConnection } from "./useKoreaderSyncConnection"

vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

const CONNECTION: KoreaderSyncConnectionDto = {
  serverUrl: "https://sync.example.com",
  username: "reader",
  connectedAt: "2026-01-01T00:00:00.000Z",
}

const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

const createConnectionScreen = () => {
  // test double: the query only calls the generated client's `get`
  const client = {
    sdkClient: {
      get: vi.fn().mockResolvedValue({ data: { connection: CONNECTION } }),
    },
  } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        {children}
      </HttpClientApiContext.Provider>
    </QueryClientProvider>
  )

  return {
    open: () => renderHook(() => useKoreaderSyncConnection(), { wrapper }),
  }
}

describe("useKoreaderSyncConnection", () => {
  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    vi.useRealTimers()
  })

  it("shows the connection right away when its screen opens again within a few minutes", async () => {
    vi.useFakeTimers()
    setActiveProfileId("profile")
    const screen = createConnectionScreen()

    const firstOpening = screen.open()
    await vi.advanceTimersByTimeAsync(0)

    expect(firstOpening.result.current.data).toEqual({ connection: CONNECTION })

    firstOpening.unmount()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS - 1)
    const openingSoonAfter = screen.open()

    expect(openingSoonAfter.result.current.data).toEqual({
      connection: CONNECTION,
    })

    openingSoonAfter.unmount()
    await vi.advanceTimersByTimeAsync(KOREADER_SYNC_CONNECTION_GC_TIME_MS)
    const openingLater = screen.open()

    expect(openingLater.result.current.isPending).toBe(true)
  })
})
