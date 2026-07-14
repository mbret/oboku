// @vitest-environment jsdom

import { QueryClient } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { setActiveProfileId, ensureActiveProfile } = vi.hoisted(() => ({
  setActiveProfileId: vi.fn(),
  ensureActiveProfile: vi.fn(),
}))

vi.mock("@sentry/react", () => ({ setUser: vi.fn() }))

vi.mock("../profiles", () => ({
  getActiveProfileId: () => undefined,
  ensureActiveProfile,
  setActiveProfileId,
}))

vi.mock("../queries/resetSessionQueries", () => ({
  resetSessionQueries: vi.fn(async () => {}),
}))

import { completeAuthentication } from "./completeAuthentication"

describe("completeAuthentication", () => {
  it("persists the session id onto the profile", async () => {
    ensureActiveProfile.mockResolvedValue({ email: "reader@example.com" })

    const putProfile = vi.fn<(profile: Profile) => Promise<void>>(
      async () => {},
    )

    await firstValueFrom(
      completeAuthentication({
        reCreateDb: vi.fn(async () => {}),
        putProfile,
        auth: {
          dbName: "reader-db",
          email: "reader@example.com",
          nameHex: "abc",
          sessionId: "session-1",
        },
        queryClient: new QueryClient(),
      }),
    )

    expect(putProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "abc",
        sessionId: "session-1",
      }),
    )
  })
})
