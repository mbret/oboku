import type { AuthSessionResponseDto } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import { useSignalValue } from "reactjrx"
import { firstValueFrom } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { clearTemporaryMasterKey, profilesStore } = vi.hoisted(() => ({
  clearTemporaryMasterKey: vi.fn(),
  profilesStore: new Map<string, Profile>(),
}))

vi.mock("./AuthorizeActionDialog", () => ({
  AuthorizeActionDialog: () => null,
  authorizeAction: vi.fn(),
  authorizeActionObservable: vi.fn(),
  clearTemporaryMasterKey,
  useWithAuthorization: vi.fn(),
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
import { synologyDriveSessionSignal } from "../plugins/synology-drive/auth/auth"
import {
  clearActiveProfileId,
  setActiveProfileId,
  useActiveProfileId,
} from "../profiles/active/activeProfileId"
import { PROFILES_BROADCAST_CHANNEL } from "../profiles/profilesBroadcast"
import { SyncProfilesAcrossTabs } from "../profiles/SyncProfilesAcrossTabs"
import { completeAuthentication } from "./completeAuthentication"
import { ForgetPreviousAccountSessions } from "./ForgetPreviousAccountSessions"

const readerSession = {
  auth: { baseUrl: "https://nas.example.com", username: "reader" },
  sid: "nas-session-id",
}

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  sessionId: "session-reader",
  ...overrides,
})

const signIn = (auth: AuthSessionResponseDto) =>
  firstValueFrom(
    completeAuthentication({
      reCreateDb: async () => {},
      putProfile: async (profile) => {
        profilesStore.set(profile.id, profile)
      },
      auth,
      queryClient: new QueryClient(),
    }),
  )

let otherTab: BroadcastChannel | undefined

const notifyProfilesChangedFromAnotherTab = () => {
  otherTab ??= new BroadcastChannel(PROFILES_BROADCAST_CHANNEL)
  otherTab.postMessage("profiles-changed")
}

describe("ForgetPreviousAccountSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    otherTab?.close()
    otherTab = undefined
    profilesStore.clear()
    clearActiveProfileId()
    synologyDriveSessionSignal.next(undefined)
  })

  it("forgets the previous account's sessions before anything renders for another account signed in after an expired session", async () => {
    const onRender = vi.fn()

    function RenderSessionOfActiveAccount() {
      const activeProfileId = useActiveProfileId()
      const synologyDriveSession = useSignalValue(synologyDriveSessionSignal)

      onRender({ activeProfileId, sid: synologyDriveSession?.sid })

      return null
    }

    profilesStore.set("reader", createProfile({ needsRelogin: true }))
    setActiveProfileId("reader")
    synologyDriveSessionSignal.next(readerSession)
    render(
      <>
        <ForgetPreviousAccountSessions />
        <RenderSessionOfActiveAccount />
      </>,
    )

    await act(async () => {
      await signIn({
        dbName: "next-reader-db",
        email: "next-reader@example.com",
        nameHex: "next-reader",
        sessionId: "session-next-reader",
      })
    })

    expect(synologyDriveSessionSignal.getValue()).toBeUndefined()
    expect(clearTemporaryMasterKey).toHaveBeenCalledTimes(1)
    expect(onRender).toHaveBeenLastCalledWith({
      activeProfileId: "next-reader",
      sid: undefined,
    })
    expect(onRender).not.toHaveBeenCalledWith({
      activeProfileId: "next-reader",
      sid: readerSession.sid,
    })
  })

  it("forgets the sessions of an account signed out in another tab", async () => {
    profilesStore.set("reader", createProfile())
    setActiveProfileId("reader")
    synologyDriveSessionSignal.next(readerSession)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SyncProfilesAcrossTabs />
        <ForgetPreviousAccountSessions />
      </QueryClientProvider>,
    )

    localStorage.removeItem(STORAGE_PROFILE_KEY)
    profilesStore.set("reader", createProfile({ status: "loggedOut" }))
    notifyProfilesChangedFromAnotherTab()

    await waitFor(() => {
      expect(synologyDriveSessionSignal.getValue()).toBeUndefined()
    })
    expect(clearTemporaryMasterKey).toHaveBeenCalledTimes(1)
  })

  it("keeps the sessions when the same account signs in again", async () => {
    profilesStore.set("reader", createProfile({ needsRelogin: true }))
    setActiveProfileId("reader")
    synologyDriveSessionSignal.next(readerSession)
    render(<ForgetPreviousAccountSessions />)

    await act(async () => {
      await signIn({
        dbName: "reader-db",
        email: "reader@example.com",
        nameHex: "reader",
        sessionId: "session-reader-relogin",
      })
    })

    expect(synologyDriveSessionSignal.getValue()).toEqual(readerSession)
    expect(clearTemporaryMasterKey).not.toHaveBeenCalled()
  })
})
