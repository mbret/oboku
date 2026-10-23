import { afterEach, describe, expect, it, vi } from "vitest"
import { STORAGE_PROFILE_KEY } from "../../config"
import { clearActiveProfileId, setActiveProfileId } from "./activeProfileId"

describe("activeProfileId", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    clearActiveProfileId()
  })

  it("tells the other tabs once it has stored the active profile it sets", () => {
    const storeItem = vi.spyOn(Storage.prototype, "setItem")
    const postToOtherTabs = vi.spyOn(BroadcastChannel.prototype, "postMessage")

    setActiveProfileId("reader")

    expect(storeItem).toHaveBeenCalledWith(STORAGE_PROFILE_KEY, "reader")
    expect(postToOtherTabs).toHaveBeenCalledWith("profiles-changed")
    expect(storeItem).toHaveBeenCalledBefore(postToOtherTabs)
  })

  it("tells the other tabs once it has removed the active profile it clears", () => {
    setActiveProfileId("reader")
    const removeItem = vi.spyOn(Storage.prototype, "removeItem")
    const postToOtherTabs = vi.spyOn(BroadcastChannel.prototype, "postMessage")

    clearActiveProfileId()

    expect(removeItem).toHaveBeenCalledWith(STORAGE_PROFILE_KEY)
    expect(postToOtherTabs).toHaveBeenCalledWith("profiles-changed")
    expect(removeItem).toHaveBeenCalledBefore(postToOtherTabs)
  })
})
