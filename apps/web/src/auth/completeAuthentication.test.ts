import { QueryClient } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { setActiveProfileId, ensureActiveProfile, forgetAccountSessions } =
  vi.hoisted(() => ({
    setActiveProfileId: vi.fn(),
    ensureActiveProfile: vi.fn(),
    forgetAccountSessions: vi.fn(),
  }))

vi.mock("../profiles", () => ({
  getActiveProfileId: () => undefined,
  ensureActiveProfile,
  setActiveProfileId,
}))

vi.mock("../queries/resetSessionQueries", () => ({
  resetSessionQueries: vi.fn(async () => {}),
}))

vi.mock("./forgetAccountSessions", () => ({ forgetAccountSessions }))

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

  it("forgets the previous account's sessions before switching to another account", async () => {
    ensureActiveProfile.mockResolvedValue({ email: "previous@example.com" })

    await signInAsReader()

    expect(forgetAccountSessions).toHaveBeenCalledBefore(setActiveProfileId)
  })

  it("forgets the sessions on a sign-in after a sign-out", async () => {
    ensureActiveProfile.mockResolvedValue(null)

    await signInAsReader()

    expect(forgetAccountSessions).toHaveBeenCalledBefore(setActiveProfileId)
  })

  it("keeps the sessions on a relogin to the same account", async () => {
    ensureActiveProfile.mockResolvedValue({ email: "reader@example.com" })

    await signInAsReader()

    expect(setActiveProfileId).toHaveBeenCalledWith("abc")
    expect(forgetAccountSessions).not.toHaveBeenCalled()
  })
})
