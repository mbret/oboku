import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "./types"

const { profilesStore, forgetAccountSessions, reopenDatabase, reloadPage } =
  vi.hoisted(() => ({
    profilesStore: new Map<string, Profile>(),
    forgetAccountSessions: vi.fn(),
    reopenDatabase: vi.fn(async () => {}),
    reloadPage: vi.fn(),
  }))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      toArray: async () => [...profilesStore.values()],
    },
  },
}))

vi.mock("../auth/useForgetAccountSessions", () => ({
  useForgetAccountSessions: () => forgetAccountSessions,
}))

vi.mock("../rxdb/RxDbProvider", async function mockRxDbProvider() {
  const { NEVER } = await import("rxjs")

  return {
    latestDatabase$: NEVER,
    getLatestDatabase: () => NEVER,
    reopenDatabase,
    useReCreateDb: () => undefined,
    useDatabase: () => ({ db: undefined }),
    ensureDatabase: () => {
      throw new Error("The database is not open")
    },
    RxDbProvider: () => null,
  }
})

vi.mock("../common/browser/reloadPage", function mockReloadPage() {
  return { reloadPage }
})

vi.mock("../queries/persister", () => ({
  persistBuster: "test",
  persister: {
    persistClient: vi.fn(async () => {}),
    restoreClient: vi.fn(async () => undefined),
    removeClient: vi.fn(async () => {}),
  },
}))

import { useIsAuthenticated } from "../auth/useIsAuthenticated"
import {
  clearActiveProfileId,
  setActiveProfileId,
  useActiveProfileId,
} from "./active/activeProfileId"
import { STORAGE_PROFILE_KEY } from "../config"
import { inboxNotificationsQueryKey } from "../notifications/inbox/queryKeys"
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

const recordRender =
  vi.fn<
    (
      renderedProfileId: string | undefined,
      forgetCount: number,
      reopenCount: number,
    ) => void
  >()

const renderSession = (queryClient = new QueryClient()) =>
  renderHook(
    function useRenderedSession() {
      recordRender(
        useActiveProfileId(),
        forgetAccountSessions.mock.calls.length,
        reopenDatabase.mock.calls.length,
      )

      return {
        active: useActiveProfile(),
        isAuthenticated: useIsAuthenticated(),
      }
    },
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
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
    forgetAccountSessions.mockClear()
    reopenDatabase.mockClear()
    reloadPage.mockClear()
    recordRender.mockClear()
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

  it("forgets the sessions and drops the session data this tab held for an account another tab signed out", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const notificationsQueryKey = inboxNotificationsQueryKey("reader")
    queryClient.setQueryData(notificationsQueryKey, [])

    const { result } = renderSession(queryClient)

    await waitFor(() => {
      expect(result.current.active.data).toEqual(createProfile())
    })

    localStorage.removeItem(STORAGE_PROFILE_KEY)
    profilesStore.set("reader", createProfile({ status: "loggedOut" }))

    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.active.data).toBeNull()
    })
    expect(queryClient.getQueryData(notificationsQueryKey)).toBeUndefined()
    expect(forgetAccountSessions).toHaveBeenCalledTimes(1)
    expect(recordRender).not.toHaveBeenCalledWith(
      undefined,
      0,
      expect.any(Number),
    )
  })

  it("reopens the database before it renders for the account another tab switched to", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")

    const { result } = renderSession()

    await waitFor(function expectReaderProfile() {
      expect(result.current.active.data).toEqual(createProfile())
    })
    expect(reopenDatabase).not.toHaveBeenCalled()

    const otherProfile = createProfile({
      id: "other-reader",
      email: "other-reader@example.com",
      nameHex: "other-reader",
      dbName: "other-reader-db",
    })
    profilesStore.set("other-reader", otherProfile)
    localStorage.setItem(STORAGE_PROFILE_KEY, "other-reader")

    notifyProfilesChangedFromAnotherTab()

    await waitFor(function expectOtherProfile() {
      expect(result.current.active.data).toEqual(otherProfile)
    })
    expect(reopenDatabase).toHaveBeenCalledTimes(1)
    expect(recordRender).not.toHaveBeenCalledWith(
      "other-reader",
      expect.any(Number),
      0,
    )
    expect(reloadPage).not.toHaveBeenCalled()
  })

  it("reloads the tab when its database does not reopen after another tab changed the account", async () => {
    reopenDatabase.mockRejectedValueOnce(new Error("The database did not open"))
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")

    const { result } = renderSession()

    await waitFor(function expectReaderProfile() {
      expect(result.current.active.data).toEqual(createProfile())
    })

    localStorage.removeItem(STORAGE_PROFILE_KEY)

    notifyProfilesChangedFromAnotherTab()

    await waitFor(function expectReload() {
      expect(reloadPage).toHaveBeenCalledOnce()
    })
  })

  it("keeps the sessions and the session data when another tab only updates the active profile", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")
    const queryClient = new QueryClient()
    const notificationsQueryKey = inboxNotificationsQueryKey("reader")
    queryClient.setQueryData(notificationsQueryKey, [])

    const { result } = renderSession(queryClient)

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    profilesStore.set("reader", createProfile({ needsRelogin: true }))

    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
    expect(queryClient.getQueryData(notificationsQueryKey)).toEqual([])
    expect(forgetAccountSessions).not.toHaveBeenCalled()
    expect(reopenDatabase).not.toHaveBeenCalled()
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
