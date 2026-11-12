import { describe, expect, it, vi } from "vitest"
import { CancelError } from "../../errors/errors.shared"
import { requestGoogleAuthorizationCode, signInWithGooglePrompt } from "./auth"

const CLIENT_ID = "123-oboku.apps.googleusercontent.com"
const SCOPES = ["https://www.googleapis.com/auth/drive.file", "openid", "email"]

const CODE_RESPONSE: google.accounts.oauth2.CodeResponse = {
  code: "4/authorization-code",
  scope: SCOPES.join(" "),
  state: "",
  error: "",
  error_description: "",
  error_uri: "",
}

/** A Google sign-in script whose popup answers `answer` once opened. */
const createGsi = (
  answer: (config: google.accounts.oauth2.CodeClientConfig) => void,
) => {
  const initCodeClient = vi.fn(function createCodeClient(
    config: google.accounts.oauth2.CodeClientConfig,
  ) {
    return {
      requestCode: function openPopup() {
        answer(config)
      },
    }
  })

  return { gsi: { accounts: { oauth2: { initCodeClient } } }, initCodeClient }
}

describe("requestGoogleAuthorizationCode", () => {
  it("opens Google's popup for the scopes and resolves with its code", async () => {
    const { gsi, initCodeClient } = createGsi(function grant(config) {
      config.callback?.(CODE_RESPONSE)
    })

    await expect(
      requestGoogleAuthorizationCode({
        gsi,
        scopes: SCOPES,
        clientId: CLIENT_ID,
      }),
    ).resolves.toBe(CODE_RESPONSE.code)
    expect(initCodeClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: CLIENT_ID,
        scope: SCOPES.join(" "),
        ux_mode: "popup",
        select_account: true,
      }),
    )
  })

  it("cancels when the user closes the popup", async () => {
    const popupClosed: google.accounts.oauth2.ClientConfigError = {
      name: "Error",
      message: "Popup window closed",
      type: "popup_closed",
    }
    const { gsi } = createGsi(function closePopup(config) {
      config.error_callback?.(popupClosed)
    })

    await expect(
      requestGoogleAuthorizationCode({
        gsi,
        scopes: SCOPES,
        clientId: CLIENT_ID,
      }),
    ).rejects.toBeInstanceOf(CancelError)
  })

  it("asks to allow pop-ups when Google's window cannot open", async () => {
    const popupBlocked: google.accounts.oauth2.ClientConfigError = {
      name: "Error",
      message: "Failed to open popup window",
      type: "popup_failed_to_open",
    }
    const { gsi } = createGsi(function blockPopup(config) {
      config.error_callback?.(popupBlocked)
    })

    await expect(
      requestGoogleAuthorizationCode({
        gsi,
        scopes: SCOPES,
        clientId: CLIENT_ID,
      }),
    ).rejects.toThrow("Allow pop-ups for oboku")
  })

  it("cancels when the user denies the consent screen", async () => {
    const { gsi } = createGsi(function deny(config) {
      config.callback?.({ ...CODE_RESPONSE, code: "", error: "access_denied" })
    })

    await expect(
      requestGoogleAuthorizationCode({
        gsi,
        scopes: SCOPES,
        clientId: CLIENT_ID,
      }),
    ).rejects.toBeInstanceOf(CancelError)
  })

  it("fails with Google's description of any other error", async () => {
    const { gsi } = createGsi(function refuse(config) {
      config.callback?.({
        ...CODE_RESPONSE,
        code: "",
        error: "invalid_request",
        error_description: "Missing required parameter: scope",
      })
    })

    await expect(
      requestGoogleAuthorizationCode({
        gsi,
        scopes: SCOPES,
        clientId: CLIENT_ID,
      }),
    ).rejects.toThrow("Missing required parameter: scope")
  })
})

describe("signInWithGooglePrompt", () => {
  it("opens Google's prompt once and resolves with the picked account's credential", async () => {
    const credential: google.accounts.id.CredentialResponse = {
      credential: "id-token",
      select_by: "user",
    }
    const initialize = vi.fn<typeof google.accounts.id.initialize>()
    const prompt = vi.fn<typeof google.accounts.id.prompt>(
      function chooseAccount() {
        initialize.mock.lastCall?.[0].callback?.(credential)
      },
    )

    await expect(
      signInWithGooglePrompt({
        gsi: { accounts: { id: { initialize, prompt } } },
        clientId: CLIENT_ID,
      }),
    ).resolves.toBe(credential)
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: CLIENT_ID, context: "signin" }),
    )
    expect(prompt).toHaveBeenCalledOnce()
  })
})
