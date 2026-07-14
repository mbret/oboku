// @vitest-environment jsdom

import {
  QueryClient,
  QueryObserver,
  type QueryKey,
  type QueryObserverOptions,
} from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("./persister", () => ({
  persistBuster: "test",
  persister: {
    persistClient: vi.fn(async () => {}),
    restoreClient: vi.fn(async () => undefined),
    removeClient: vi.fn(async () => {}),
  },
}))

import { withQueryOptionsAuthentication } from "../auth"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"
import { persister } from "./persister"
import { resetSessionQueries } from "./resetSessionQueries"

const activeCleanups: Array<() => void> = []

/**
 * Subscribes an imperative observer so the query stays "active" with the
 * options of its last render — exactly the state a mounted `useQuery` is in
 * when `resetSessionQueries` runs before React re-renders it.
 */
const mountObservedQuery = async <TQueryKey extends QueryKey>(
  queryClient: QueryClient,
  options: QueryObserverOptions<string, Error, string, string, TQueryKey>,
) => {
  const queryFn = vi.fn(async () => "data")
  const observer = new QueryObserver(queryClient, {
    ...options,
    queryFn,
  })
  const unsubscribe = observer.subscribe(function noopObserverListener() {})

  activeCleanups.push(unsubscribe)

  await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1))

  return queryFn
}

describe("resetSessionQueries", () => {
  afterEach(() => {
    activeCleanups.forEach(function runCleanup(cleanup) {
      cleanup()
    })
    activeCleanups.length = 0
    clearActiveProfileId()
  })

  it("resets authenticated queries without refetching them on sign-out", async () => {
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const authenticatedQueryKey = ["api", "notifications", "unread-count"]
    const authenticatedQueryFn = await mountObservedQuery(
      queryClient,
      withQueryOptionsAuthentication({ queryKey: authenticatedQueryKey }),
    )
    const localQueryFn = await mountObservedQuery(queryClient, {
      queryKey: ["rxdb", "books"],
    })

    clearActiveProfileId()
    resetSessionQueries(queryClient)

    await vi.waitFor(() => expect(localQueryFn).toHaveBeenCalledTimes(2))
    expect(authenticatedQueryFn).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(authenticatedQueryKey)).toBeUndefined()
  })

  it("refetches authenticated queries on account switch", async () => {
    setActiveProfileId("previous-reader")
    const queryClient = new QueryClient()
    const authenticatedQueryFn = await mountObservedQuery(
      queryClient,
      withQueryOptionsAuthentication({
        queryKey: ["api", "notifications", "unread-count"],
      }),
    )

    setActiveProfileId("next-reader")
    resetSessionQueries(queryClient)

    await vi.waitFor(() =>
      expect(authenticatedQueryFn).toHaveBeenCalledTimes(2),
    )
  })

  it("honors the caller's own enabled condition", async () => {
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const queryFn = vi.fn(async () => "data")
    const observer = new QueryObserver(
      queryClient,
      withQueryOptionsAuthentication({
        queryKey: ["api", "notifications", "unread-count"],
        queryFn,
        enabled: false,
      }),
    )
    activeCleanups.push(observer.subscribe(function noopObserverListener() {}))

    resetSessionQueries(queryClient)

    expect(queryFn).not.toHaveBeenCalled()
  })

  it("awaits an offline snapshot flush that drops session data on sign-out", async () => {
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    await mountObservedQuery(
      queryClient,
      withQueryOptionsAuthentication({
        queryKey: ["api", "notifications", "list"],
        meta: { persist: true },
      }),
    )
    vi.mocked(persister.persistClient).mockClear()

    clearActiveProfileId()
    await resetSessionQueries(queryClient)

    expect(persister.persistClient).toHaveBeenCalledTimes(1)
    const [persisted] = vi.mocked(persister.persistClient).mock.calls[0] ?? []
    expect(persisted?.clientState.queries).toHaveLength(0)
  })

  it("leaves session-surviving queries untouched on sign-out", async () => {
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const survivorQueryKey = ["api", "config"]
    const survivorQueryFn = await mountObservedQuery(queryClient, {
      queryKey: survivorQueryKey,
      meta: { survivesSessionReset: true },
    })

    clearActiveProfileId()
    resetSessionQueries(queryClient)

    expect(survivorQueryFn).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(survivorQueryKey)).toBe("data")
  })
})
