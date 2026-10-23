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
import { inboxNotificationsQueryKey } from "../notifications/inbox/queryKeys"
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

const switchAccountFromAnotherTab = async (
  queryClient: QueryClient,
  profileId: string,
) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profileId)
  syncActiveProfileIdFromStorage()
  await resetSessionQueries(queryClient)
}

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
      queryKeyOf: inboxNotificationsQueryKey,
      fetchForProfile: fetchNotifications,
    })

    await waitFor(() => {
      expect(fetchNotifications).toHaveBeenCalledTimes(1)
    })

    await act(() => queryClient.refetchQueries())

    expect(fetchNotifications).toHaveBeenCalledTimes(2)
  })

  it("does not fetch while signed out", async () => {
    const queryClient = new QueryClient()
    const fetchNotifications = vi.fn(async () => "notifications")
    renderQueryOfActiveProfile({
      queryClient,
      queryKeyOf: inboxNotificationsQueryKey,
      fetchForProfile: fetchNotifications,
    })

    await act(() => queryClient.refetchQueries())

    expect(fetchNotifications).not.toHaveBeenCalled()
  })

  it("does not fetch while the session needs relogin", async () => {
    profilesStore.set("reader", {
      ...createProfile("reader"),
      needsRelogin: true,
    })
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const fetchNotifications = vi.fn(async () => "notifications")
    renderQueryOfActiveProfile({
      queryClient,
      queryKeyOf: inboxNotificationsQueryKey,
      fetchForProfile: fetchNotifications,
    })

    await act(() => queryClient.refetchQueries())

    expect(fetchNotifications).not.toHaveBeenCalled()
  })

  describe("after another tab switches accounts", () => {
    it("fetches for the next account only, under a key that names the account", async () => {
      profilesStore.set("reader", createProfile("reader"))
      profilesStore.set("next-reader", createProfile("next-reader"))
      setActiveProfileId("reader")
      const queryClient = new QueryClient()
      const fetchNotifications = vi.fn(async () => "notifications")
      renderQueryOfActiveProfile({
        queryClient,
        queryKeyOf: inboxNotificationsQueryKey,
        fetchForProfile: fetchNotifications,
      })

      await waitFor(() => {
        expect(fetchNotifications).toHaveBeenCalledWith("reader")
      })

      await act(() => switchAccountFromAnotherTab(queryClient, "next-reader"))

      await waitFor(() => {
        expect(fetchNotifications).toHaveBeenLastCalledWith("next-reader")
      })
      expect(fetchNotifications.mock.calls).toEqual([
        ["reader"],
        ["next-reader"],
      ])
    })

    it("fetches for the next account only, under a key that does not name the account", async () => {
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

      await act(() => switchAccountFromAnotherTab(queryClient, "next-reader"))

      await waitFor(() => {
        expect(fetchSyncReports).toHaveBeenLastCalledWith("next-reader")
      })
      expect(fetchSyncReports.mock.calls).toEqual([["reader"], ["next-reader"]])
    })

    it("does not fetch before this tab adopts the switch", async () => {
      profilesStore.set("reader", createProfile("reader"))
      profilesStore.set("next-reader", createProfile("next-reader"))
      setActiveProfileId("reader")
      const queryClient = new QueryClient()
      const fetchNotifications = vi.fn(async () => "notifications")
      renderQueryOfActiveProfile({
        queryClient,
        queryKeyOf: inboxNotificationsQueryKey,
        fetchForProfile: fetchNotifications,
      })

      await waitFor(() => {
        expect(fetchNotifications).toHaveBeenCalledWith("reader")
      })

      localStorage.setItem(STORAGE_PROFILE_KEY, "next-reader")
      await act(() => queryClient.refetchQueries())
      act(() => {
        syncActiveProfileIdFromStorage()
      })

      await waitFor(() => {
        expect(fetchNotifications).toHaveBeenLastCalledWith("next-reader")
      })
      expect(fetchNotifications.mock.calls).toEqual([
        ["reader"],
        ["next-reader"],
      ])
    })
  })
})
