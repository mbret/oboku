import { DropboxAuth } from "dropbox"
import { describe, expect, it } from "vitest"
import { googleAccessTokenSignal } from "../google/auth"
import { dropboxAuthSignal } from "./dropbox/lib/auth"
import { signOutPlugins } from "./signOutPlugins"
import { synologyDriveSessionSignal } from "./synology-drive/auth/auth"

describe("signOutPlugins", () => {
  it("forgets the Synology Drive session so the next account in this tab does not inherit it", () => {
    synologyDriveSessionSignal.setValue({
      auth: { baseUrl: "https://nas.example.com", username: "reader" },
      sid: "nas-session-id",
    })

    signOutPlugins()

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

    signOutPlugins()

    expect(googleAccessTokenSignal.getValue()).toBeUndefined()
  })

  it("forgets the Dropbox session so the next account in this tab does not inherit it", () => {
    dropboxAuthSignal.update(
      new DropboxAuth({ accessToken: "dropbox-access-token" }),
    )

    signOutPlugins()

    expect(dropboxAuthSignal.getValue()).toBeUndefined()
  })
})
