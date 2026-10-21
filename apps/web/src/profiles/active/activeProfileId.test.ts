import { afterEach, describe, expect, it } from "vitest"
import { STORAGE_PROFILE_KEY } from "../../config"
import { PROFILES_BROADCAST_CHANNEL } from "../profilesBroadcast"
import { clearActiveProfileId, setActiveProfileId } from "./activeProfileId"

const readStoredProfileIdOnNextBroadcast = () => {
  const otherTab = new BroadcastChannel(PROFILES_BROADCAST_CHANNEL)
  const { promise, resolve } = Promise.withResolvers<string | null>()

  otherTab.addEventListener(
    "message",
    function readStoredProfileId() {
      resolve(localStorage.getItem(STORAGE_PROFILE_KEY))
      otherTab.close()
    },
    { once: true },
  )

  return promise
}

describe("activeProfileId", () => {
  afterEach(() => {
    clearActiveProfileId()
  })

  it("tells the other tabs to read the active profile it sets", async () => {
    const storedProfileIdOnBroadcast = readStoredProfileIdOnNextBroadcast()

    setActiveProfileId("reader")

    await expect(storedProfileIdOnBroadcast).resolves.toBe("reader")
  })

  it("tells the other tabs to read the active profile it clears", async () => {
    localStorage.setItem(STORAGE_PROFILE_KEY, "reader")
    const storedProfileIdOnBroadcast = readStoredProfileIdOnNextBroadcast()

    clearActiveProfileId()

    await expect(storedProfileIdOnBroadcast).resolves.toBeNull()
  })
})
