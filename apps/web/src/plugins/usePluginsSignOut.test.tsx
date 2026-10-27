import { renderHook } from "@testing-library/react"
import { DropboxAuth } from "dropbox"
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest"
import { Logger } from "../debug/logger.shared"
import { googleAccessTokenSignal } from "../integrations/google/auth"
import { pluginsByType } from "./configure"
import { dropboxAuthSignal } from "../integrations/dropbox/dropboxPlugin/lib/auth"
import { msalAccountSignal } from "../integrations/one-drive/oneDrivePlugin/auth/auth"
import { synologyDriveSessionSignal } from "../integrations/synology-drive/synologyDrivePlugin/auth/auth"
import { usePluginsSignOut } from "./usePluginsSignOut"

const synologyDriveSession = {
  auth: { baseUrl: "https://nas.example.com", username: "reader" },
  sid: "nas-session-id",
}

describe("usePluginsSignOut", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("forgets the Synology Drive session so the next account in this tab does not inherit it", () => {
    synologyDriveSessionSignal.setValue(synologyDriveSession)

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

  it("forgets the Dropbox session so the next account in this tab does not inherit it", () => {
    dropboxAuthSignal.update(
      new DropboxAuth({ accessToken: "dropbox-access-token" }),
    )

    const { result } = renderHook(usePluginsSignOut)

    result.current()

    expect(dropboxAuthSignal.getValue()).toBeUndefined()
  })

  it("forgets the OneDrive account when no MSAL client is open", () => {
    msalAccountSignal.next({
      homeAccountId: "home-account-id",
      environment: "login.microsoftonline.com",
      tenantId: "tenant-id",
      username: "reader@example.com",
      localAccountId: "local-account-id",
    })

    const { result } = renderHook(usePluginsSignOut)

    result.current()

    expect(msalAccountSignal.getValue()).toBeUndefined()
  })

  it("logs a plugin whose sign-out throws and still signs the others out", () => {
    synologyDriveSessionSignal.setValue(synologyDriveSession)
    const signOutError = new Error("Dropbox sign-out failed")
    const useDropboxSignOut = pluginsByType.dropbox.useSignOut
    onTestFinished(function restoreDropboxSignOut() {
      pluginsByType.dropbox.useSignOut = useDropboxSignOut
    })
    pluginsByType.dropbox.useSignOut = function useThrowingSignOut() {
      return function throwOnSignOut() {
        throw signOutError
      }
    }
    const logError = vi
      .spyOn(Logger, "error")
      .mockImplementation(function silenceLogger() {})

    const { result } = renderHook(usePluginsSignOut)

    expect(result.current).not.toThrow()
    expect(synologyDriveSessionSignal.getValue()).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("dropbox"),
      signOutError,
    )
  })
})
