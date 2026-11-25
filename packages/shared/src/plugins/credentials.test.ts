import { describe, expect, it } from "vitest"
import { parseSourceApiCredentials } from "./credentials"

describe("sourceApiCredentialsSchemas", () => {
  it("parses valid OneDrive credentials", () => {
    expect(
      parseSourceApiCredentials("one-drive", {
        accessToken: "token",
        expiresAt: 123,
      }),
    ).toEqual({
      accessToken: "token",
      expiresAt: 123,
    })
  })

  it("rejects OneDrive credentials without an access token", () => {
    expect(() => parseSourceApiCredentials("one-drive", {})).toThrow(
      /accessToken/i,
    )
  })

  it("accepts empty credentials for URI providers", () => {
    expect(parseSourceApiCredentials("URI", undefined)).toEqual({})
  })

  it("accepts the Google token payload shape we currently send from the web", () => {
    expect(
      parseSourceApiCredentials("DRIVE", {
        access_token: "token",
        token_type: "Bearer",
        expires_in: "3600",
        created_at: 123,
      }),
    ).toEqual({
      access_token: "token",
      token_type: "Bearer",
      expires_in: "3600",
      created_at: 123,
    })
  })

  it("accepts Dropbox credentials from an online sign-in, which has no refresh token", () => {
    const onlineSignInCredentials = {
      accessToken: "token",
      accessTokenExpiresAt: "2026-10-21T14:00:00.000Z",
      clientId: "client-id",
      codeVerifier: "code-verifier",
    }

    expect(
      parseSourceApiCredentials("dropbox", onlineSignInCredentials),
    ).toEqual(onlineSignInCredentials)
  })
})
