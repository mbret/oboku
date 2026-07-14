// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "./types"

const { profilesStore } = vi.hoisted(() => ({
  profilesStore: new Map<string, Profile>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      get: async (id: string) => profilesStore.get(id),
      put: async (profile: Profile) => {
        profilesStore.set(profile.id, profile)
      },
      toArray: async () => [...profilesStore.values()],
      update: async (id: string, patch: Partial<Profile>) => {
        const profile = profilesStore.get(id)

        if (!profile) return 0

        profilesStore.set(id, { ...profile, ...patch })

        return 1
      },
    },
  },
}))

vi.mock("./active/activeProfileId", () => ({
  activeProfileIdSignal: { update: vi.fn() },
  getProfile: () => undefined,
  setProfile: vi.fn(),
}))

const renderMigration = async () => {
  const { LegacyAuthMigration } = await import("./LegacyAuthMigration")

  render(
    <LegacyAuthMigration>
      <div>ready</div>
    </LegacyAuthMigration>,
  )
}

describe("LegacyAuthMigration session id backfill", () => {
  beforeEach(() => {
    vi.resetModules()
    profilesStore.clear()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it("backfills a random session id onto a row persisted before the field existed", async () => {
    // Models a row written by an older build; the cast expresses real runtime
    // data that predates the current required `sessionId` type.
    const legacyRow = {
      id: "reader",
      email: "reader@example.com",
      nameHex: "reader",
      dbName: "reader-db",
    } as Profile
    profilesStore.set("reader", legacyRow)

    await renderMigration()

    await waitFor(() => {
      expect(profilesStore.get("reader")?.sessionId).toEqual(expect.any(String))
    })
  })

  it("leaves an existing session id untouched", async () => {
    profilesStore.set("reader", {
      id: "reader",
      email: "reader@example.com",
      nameHex: "reader",
      dbName: "reader-db",
      sessionId: "keep-me",
    })

    await renderMigration()

    await waitFor(() => {
      expect(profilesStore.get("reader")?.sessionId).toBe("keep-me")
    })
  })
})
