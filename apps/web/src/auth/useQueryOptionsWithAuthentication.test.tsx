import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { profilesStore } = vi.hoisted(() => ({
  profilesStore: new Map<string, Profile>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      toArray: async () => [...profilesStore.values()],
    },
  },
}))

vi.mock("../queries/persister", () => ({
  persistBuster: "test",
  persister: {
    persistClient: vi.fn(async () => {}),
    restoreClient: vi.fn(async () => undefined),
    removeClient: vi.fn(async () => {}),
  },
}))

import { STORAGE_PROFILE_KEY } from "../config"
import {
  clearActiveProfileId,
  setActiveProfileId,
  syncActiveProfileIdFromStorage,
  useActiveProfileId,
} from "../profiles/active/activeProfileId"
import { resetSessionQueries } from "../queries/resetSessionQueries"
import { useQueryOptionsWithAuthentication } from "./useQueryOptionsWithAuthentication"

const createProfile = (id: string): Profile => ({
  id,
  email: `${id}@example.com`,
  nameHex: id,
  dbName: `${id}-db`,
  sessionId: `session-${id}`,
})

const notificationsQueryKey = (profileId: string | undefined) => [
  "api",
  "notifications",
  profileId,
  "list",
]

const syncReportsQueryKey = () => ["api/datasourceReport"]

const renderQueryOfActiveProfile = ({
  queryClient,
  queryKeyOf,
  fetchForProfile,
}: {
  queryClient: QueryClient
  queryKeyOf: (profileId: string | undefined) => QueryKey
  fetchForProfile: (profileId: string | undefined) => Promise<string>
}) =>
  renderHook(
    function useQueryOfActiveProfile() {
      const activeProfileId = useActiveProfileId()

      return useQuery(
        useQueryOptionsWithAuthentication({
          queryKey: queryKeyOf(activeProfileId),
          queryFn: function fetchForRenderedProfile() {
            return fetchForProfile(activeProfileId)
          },
        }),
      )
    },
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    },
  )

describe("useQueryOptionsWithAuthentication", () => {
  afterEach(() => {
    cleanup()
    profilesStore.clear()
    clearActiveProfileId()
  })

  it("refetches for the account it rendered for", async () => {
    profilesStore.set("reader", createProfile("reader"))
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const fetchNotifications = vi.fn(async () => "notifications")
    renderQueryOfActiveProfile({
      queryClient,
      queryKeyOf: notificationsQueryKey,
      fetchForProfile: fetchNotifications,
    })

    await waitFor(() => {
      expect(fetchNotifications).toHaveBeenCalledTimes(1)
    })

    await act(() => queryClient.refetchQueries())

    expect(fetchNotifications).toHaveBeenCalledTimes(2)
  })

  it("does not fetch for an account once another tab made another one active", async () => {
    profilesStore.set("reader", createProfile("reader"))
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const fetchNotifications = vi.fn(async () => "notifications")
    renderQueryOfActiveProfile({
      queryClient,
      queryKeyOf: notificationsQueryKey,
      fetchForProfile: fetchNotifications,
    })

    await waitFor(() => {
      expect(fetchNotifications).toHaveBeenCalledWith("reader")
    })

    await act(async () => {
      localStorage.setItem(STORAGE_PROFILE_KEY, "next-reader")
      syncActiveProfileIdFromStorage()
      await resetSessionQueries(queryClient)
    })

    expect(fetchNotifications).toHaveBeenCalledTimes(1)
  })

  it("fetches for the next account once it re-renders, under a key that does not name the account", async () => {
    profilesStore.set("reader", createProfile("reader"))
    profilesStore.set("next-reader", createProfile("next-reader"))
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const fetchSyncReports = vi.fn(async () => "reports")
    renderQueryOfActiveProfile({
      queryClient,
      queryKeyOf: syncReportsQueryKey,
      fetchForProfile: fetchSyncReports,
    })

    await waitFor(() => {
      expect(fetchSyncReports).toHaveBeenCalledWith("reader")
    })

    await act(async () => {
      localStorage.setItem(STORAGE_PROFILE_KEY, "next-reader")
      syncActiveProfileIdFromStorage()
      await resetSessionQueries(queryClient)
    })

    await waitFor(() => {
      expect(fetchSyncReports).toHaveBeenCalledTimes(2)
    })
    expect(fetchSyncReports).toHaveBeenLastCalledWith("next-reader")
  })
})
