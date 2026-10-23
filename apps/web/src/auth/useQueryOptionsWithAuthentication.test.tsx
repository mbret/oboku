import {
  QueryClient,
  QueryClientProvider,
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

const renderNotificationsOfActiveProfile = (
  queryClient: QueryClient,
  fetchNotifications: (profileId: string | undefined) => Promise<string>,
) =>
  renderHook(
    function useNotificationsOfActiveProfile() {
      const activeProfileId = useActiveProfileId()

      return useQuery(
        useQueryOptionsWithAuthentication({
          queryKey: ["api", "notifications", activeProfileId, "list"],
          queryFn: function fetchNotificationsOfRenderedProfile() {
            return fetchNotifications(activeProfileId)
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
    renderNotificationsOfActiveProfile(queryClient, fetchNotifications)

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
    renderNotificationsOfActiveProfile(queryClient, fetchNotifications)

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
})
