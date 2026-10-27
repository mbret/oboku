import { parseProviderApiCredentials } from "@oboku/shared"
import { DropboxAuth } from "dropbox"
import { SIGNAL_RESET } from "reactjrx"
import { describe, expect, it, onTestFinished } from "vitest"
import { dropboxAuthSignal, requestDropboxProviderCredentials } from "./auth"

function signInToDropbox({ refreshToken }: { refreshToken?: string } = {}) {
  const accessTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2)
  const dropboxAuth = new DropboxAuth({
    clientId: "dropbox-client-id",
    accessToken: "access-token",
    accessTokenExpiresAt,
    refreshToken,
  })
  dropboxAuth.setCodeVerifier("code-verifier")
  dropboxAuthSignal.update(dropboxAuth)
  onTestFinished(function signOutOfDropbox() {
    dropboxAuthSignal.update(SIGNAL_RESET)
  })

  return { accessTokenExpiresAt }
}

async function declinePopup() {
  return false
}

describe("requestDropboxProviderCredentials", function testRequestDropboxProviderCredentials() {
  it("maps the session's Dropbox auth to provider credentials", async function mapSessionAuth() {
    const { accessTokenExpiresAt } = signInToDropbox({
      refreshToken: "refresh-token",
    })

    await expect(
      requestDropboxProviderCredentials({
        clientId: "dropbox-client-id",
        requestPopup: declinePopup,
      }),
    ).resolves.toEqual({
      accessToken: "access-token",
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      clientId: "dropbox-client-id",
      codeVerifier: "code-verifier",
      refreshToken: "refresh-token",
    })
  })

  it("maps an online sign-in, which has no refresh token, to credentials the API accepts", async function mapOnlineSignIn() {
    const { accessTokenExpiresAt } = signInToDropbox()

    const credentials = await requestDropboxProviderCredentials({
      clientId: "dropbox-client-id",
      requestPopup: declinePopup,
    })

    expect(credentials).toEqual({
      accessToken: "access-token",
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      clientId: "dropbox-client-id",
      codeVerifier: "code-verifier",
    })
    expect(parseProviderApiCredentials("dropbox", credentials)).toEqual(
      credentials,
    )
  })
})
