import { cleanup, render, screen } from "@testing-library/react"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
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
  getActiveProfileId: () => undefined,
  setActiveProfileId: vi.fn(),
}))

import { LegacyAuthMigration } from "./LegacyAuthMigration"

describe("LegacyAuthMigration session id backfill", () => {
  beforeAll(async function migrateLegacyAndCurrentRows() {
    localStorage.clear()
    // Models a row written by an older build; the cast expresses real runtime
    // data that predates the current required `sessionId` type.
    const legacyRow = {
      id: "legacy-reader",
      email: "legacy@example.com",
      nameHex: "legacy-reader",
      dbName: "legacy-db",
    } as Profile
    profilesStore.set(legacyRow.id, legacyRow)
    profilesStore.set("current-reader", {
      id: "current-reader",
      email: "current@example.com",
      nameHex: "current-reader",
      dbName: "current-db",
      sessionId: "keep-me",
    })

    render(
      <LegacyAuthMigration>
        <div>ready</div>
      </LegacyAuthMigration>,
    )

    await screen.findByText("ready")
  })

  afterAll(function unmountMigration() {
    cleanup()
  })

  it("backfills a random session id onto a row persisted before the field existed", () => {
    expect(profilesStore.get("legacy-reader")?.sessionId).toEqual(
      expect.any(String),
    )
  })

  it("leaves an existing session id untouched", () => {
    expect(profilesStore.get("current-reader")?.sessionId).toBe("keep-me")
  })
})
