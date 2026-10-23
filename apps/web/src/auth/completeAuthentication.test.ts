import { QueryClient } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { setActiveProfileId, ensureActiveProfile, resetSessionQueries } =
  vi.hoisted(() => ({
    setActiveProfileId: vi.fn(),
    ensureActiveProfile: vi.fn(),
    resetSessionQueries: vi.fn(async () => {}),
  }))

vi.mock("@sentry/react", () => ({ setUser: vi.fn() }))

vi.mock("../profiles", () => ({
  getActiveProfileId: () => undefined,
  ensureActiveProfile,
  setActiveProfileId,
}))

vi.mock("../queries/resetSessionQueries", () => ({ resetSessionQueries }))

import { completeAuthentication } from "./completeAuthentication"

const signInAsReader = (
  putProfile: (profile: Profile) => Promise<void> = async () => {},
) =>
  firstValueFrom(
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

describe("completeAuthentication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("persists the session id onto the profile", async () => {
    ensureActiveProfile.mockResolvedValue({ email: "reader@example.com" })
    const putProfile = vi.fn<(profile: Profile) => Promise<void>>(
      async () => {},
    )

    await signInAsReader(putProfile)

    expect(putProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "abc",
        sessionId: "session-1",
      }),
    )
  })

  it("makes the next account active before resetting the session queries", async () => {
    ensureActiveProfile.mockResolvedValue({ email: "previous@example.com" })

    await signInAsReader()

    expect(setActiveProfileId).toHaveBeenCalledBefore(resetSessionQueries)
  })
})
