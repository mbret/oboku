import { DropboxAuth } from "dropbox"
import { SIGNAL_RESET } from "reactjrx"
import { describe, expect, it, onTestFinished } from "vitest"
import { dropboxAuthSignal, requestDropboxProviderCredentials } from "./auth"

describe("requestDropboxProviderCredentials", function testRequestDropboxProviderCredentials() {
  it("maps the session's Dropbox auth to provider credentials", async function mapSessionAuth() {
    const accessTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2)
    const dropboxAuth = new DropboxAuth({ clientId: "dropbox-client-id" })
    dropboxAuth.setAccessToken("access-token")
    dropboxAuth.setAccessTokenExpiresAt(accessTokenExpiresAt)
    dropboxAuth.setCodeVerifier("code-verifier")
    dropboxAuth.setRefreshToken("refresh-token")
    dropboxAuthSignal.update(dropboxAuth)
    onTestFinished(function signOutOfDropbox() {
      dropboxAuthSignal.update(SIGNAL_RESET)
    })

    await expect(
      requestDropboxProviderCredentials({
        clientId: "dropbox-client-id",
        requestPopup: async function declinePopup() {
          return false
        },
      }),
    ).resolves.toEqual({
      accessToken: "access-token",
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      clientId: "dropbox-client-id",
      codeVerifier: "code-verifier",
      refreshToken: "refresh-token",
    })
  })
})
