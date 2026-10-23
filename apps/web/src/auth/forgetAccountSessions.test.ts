import { DropboxAuth } from "dropbox"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest"

const { clearTemporaryMasterKey } = vi.hoisted(() => ({
  clearTemporaryMasterKey: vi.fn(),
}))

vi.mock("./AuthorizeActionDialog", () => ({
  AuthorizeActionDialog: () => null,
  authorizeAction: vi.fn(),
  authorizeActionObservable: vi.fn(),
  clearTemporaryMasterKey,
  useWithAuthorization: vi.fn(),
}))

import { Logger } from "../debug/logger.shared"
import { googleAccessTokenSignal } from "../google/auth"
import { pluginsByType } from "../plugins/configure"
import { dropboxAuthSignal } from "../plugins/dropbox/lib/auth"
import { msalAccountSignal } from "../plugins/one-drive/auth/auth"
import { synologyDriveSessionSignal } from "../plugins/synology-drive/auth/auth"
import { forgetAccountSessions } from "./forgetAccountSessions"

const synologyDriveSession = {
  auth: { baseUrl: "https://nas.example.com", username: "reader" },
  sid: "nas-session-id",
}

describe("forgetAccountSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("clears the temporary master key", () => {
    forgetAccountSessions()

    expect(clearTemporaryMasterKey).toHaveBeenCalledTimes(1)
  })

  it("forgets the Synology Drive session so the next account in this tab does not inherit it", () => {
    synologyDriveSessionSignal.setValue(synologyDriveSession)

    forgetAccountSessions()

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

    forgetAccountSessions()

    expect(googleAccessTokenSignal.getValue()).toBeUndefined()
  })

  it("forgets the Dropbox session so the next account in this tab does not inherit it", () => {
    dropboxAuthSignal.update(
      new DropboxAuth({ accessToken: "dropbox-access-token" }),
    )

    forgetAccountSessions()

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

    forgetAccountSessions()

    expect(msalAccountSignal.getValue()).toBeUndefined()
  })

  it("logs a plugin whose sign-out throws and still signs the others out", () => {
    synologyDriveSessionSignal.setValue(synologyDriveSession)
    const signOutError = new Error("Dropbox sign-out failed")
    const dropboxSignOut = pluginsByType.dropbox.signOut
    onTestFinished(function restoreDropboxSignOut() {
      pluginsByType.dropbox.signOut = dropboxSignOut
    })
    pluginsByType.dropbox.signOut = function throwOnSignOut() {
      throw signOutError
    }
    const logError = vi
      .spyOn(Logger, "error")
      .mockImplementation(function silenceLogger() {})

    expect(forgetAccountSessions).not.toThrow()

    expect(synologyDriveSessionSignal.getValue()).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining(pluginsByType.dropbox.name),
      signOutError,
    )
  })
})
