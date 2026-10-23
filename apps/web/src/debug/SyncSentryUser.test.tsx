import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { profilesStore, setUser } = vi.hoisted(() => ({
  profilesStore: new Map<string, Profile>(),
  setUser: vi.fn(),
}))

vi.mock("@sentry/react", async function mockSetUser(importOriginal) {
  return {
    ...(await importOriginal<typeof import("@sentry/react")>()),
    setUser,
  }
})

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      toArray: async () => [...profilesStore.values()],
    },
  },
}))

import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"
import { SyncSentryUser } from "./SyncSentryUser"

const createProfile = (id: string): Profile => ({
  id,
  email: `${id}@example.com`,
  nameHex: id,
  dbName: `${id}-db`,
  sessionId: `session-${id}`,
})

const sentryUserOf = (profile: Profile) => ({
  email: profile.email,
  id: profile.nameHex,
  username: profile.dbName,
})

const renderSyncSentryUser = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SyncSentryUser />
    </QueryClientProvider>,
  )

describe("SyncSentryUser", () => {
  afterEach(() => {
    cleanup()
    profilesStore.clear()
    clearActiveProfileId()
    setUser.mockClear()
  })

  it("identifies the user of the active profile", async () => {
    const reader = createProfile("reader")
    profilesStore.set(reader.id, reader)
    setActiveProfileId(reader.id)

    renderSyncSentryUser()

    await waitFor(() => {
      expect(setUser).toHaveBeenLastCalledWith(sentryUserOf(reader))
    })
  })

  it("identifies the next user after a switch to another account", async () => {
    const reader = createProfile("reader")
    const nextReader = createProfile("next-reader")
    profilesStore.set(reader.id, reader)
    profilesStore.set(nextReader.id, nextReader)
    setActiveProfileId(reader.id)
    renderSyncSentryUser()

    await waitFor(() => {
      expect(setUser).toHaveBeenLastCalledWith(sentryUserOf(reader))
    })

    act(() => {
      setActiveProfileId(nextReader.id)
    })

    await waitFor(() => {
      expect(setUser).toHaveBeenLastCalledWith(sentryUserOf(nextReader))
    })
  })

  it("clears the user once no account is active", async () => {
    const reader = createProfile("reader")
    profilesStore.set(reader.id, reader)
    setActiveProfileId(reader.id)
    renderSyncSentryUser()

    await waitFor(() => {
      expect(setUser).toHaveBeenLastCalledWith(sentryUserOf(reader))
    })

    act(() => {
      clearActiveProfileId()
    })

    await waitFor(() => {
      expect(setUser).toHaveBeenLastCalledWith(null)
    })
  })
})
