// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "./types"

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

import { useIsAuthenticated } from "../auth/useIsAuthenticated"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "./active/activeProfileId"
import { STORAGE_PROFILE_KEY } from "../config"
import { useActiveProfile } from "./active/useActiveProfile"
import { PROFILES_BROADCAST_CHANNEL } from "./profilesBroadcast"
import { SyncProfilesAcrossTabs } from "./SyncProfilesAcrossTabs"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  sessionId: "session-default",
  ...overrides,
})

let otherTab: BroadcastChannel | undefined

const notifyProfilesChangedFromAnotherTab = () => {
  otherTab ??= new BroadcastChannel(PROFILES_BROADCAST_CHANNEL)
  otherTab.postMessage("profiles-changed")
}

const renderSession = () =>
  renderHook(
    () => ({
      active: useActiveProfile(),
      isAuthenticated: useIsAuthenticated(),
    }),
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        const queryClient = new QueryClient()

        return (
          <QueryClientProvider client={queryClient}>
            <SyncProfilesAcrossTabs />
            {children}
          </QueryClientProvider>
        )
      },
    },
  )

describe("SyncProfilesAcrossTabs", () => {
  afterEach(() => {
    cleanup()
    otherTab?.close()
    otherTab = undefined
    profilesStore.clear()
    clearActiveProfileId()
  })

  it("reflects a sign-in performed in another tab", async () => {
    const { result } = renderSession()

    await waitFor(() => {
      expect(result.current.active.isSuccess).toBe(true)
    })
    expect(result.current.active.data).toBeNull()

    profilesStore.set("reader", createProfile())
    localStorage.setItem(STORAGE_PROFILE_KEY, "reader")

    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.active.data).toEqual(createProfile())
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("reflects a sign-out performed in another tab", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")

    const { result } = renderSession()

    await waitFor(() => {
      expect(result.current.active.data).toEqual(createProfile())
    })

    localStorage.removeItem(STORAGE_PROFILE_KEY)

    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.active.data).toBeNull()
    })
  })

  it("reflects a session expiry (needsRelogin) flagged in another tab", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")

    const { result } = renderSession()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    profilesStore.set("reader", createProfile({ needsRelogin: true }))

    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
    expect(result.current.active.data).toEqual(
      createProfile({ needsRelogin: true }),
    )
  })
})
