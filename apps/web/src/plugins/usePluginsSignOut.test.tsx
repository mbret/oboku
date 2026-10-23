import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { googleAccessTokenSignal } from "../google/auth"
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

  it("forgets the Google Drive access token so the next account in this tab does not inherit it", () => {
    googleAccessTokenSignal.next({
      access_token: "google-access-token",
      expires_in: "3600",
      hd: "",
      prompt: "",
      token_type: "Bearer",
      scope: "https://www.googleapis.com/auth/drive.file",
      state: "",
      error: "",
      error_description: "",
      error_uri: "",
      created_at: Date.now(),
    })

    const { result } = renderHook(usePluginsSignOut)

    result.current()

    expect(googleAccessTokenSignal.getValue()).toBeUndefined()
  })
})
