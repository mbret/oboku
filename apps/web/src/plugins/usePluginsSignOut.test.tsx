import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { synologyDriveSessionSignal } from "./synology-drive/auth/auth"
import { usePluginsSignOut } from "./usePluginsSignOut"

describe("usePluginsSignOut", () => {
  it("forgets the Synology Drive session so the next account in this tab does not inherit it", () => {
    synologyDriveSessionSignal.setValue({
      auth: { baseUrl: "https://nas.example.com", username: "reader" },
      sid: "nas-session-id",
    })

    const { result } = renderHook(usePluginsSignOut)

    result.current()

    expect(synologyDriveSessionSignal.getValue()).toBeUndefined()
  })
})
