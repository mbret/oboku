import { SIGNAL_RESET, signal, useSignalValue } from "reactjrx"
import { from, switchMap } from "rxjs"
import { gsiOrThrow$ } from "./gsi"
import { CancelError } from "../../errors/errors.shared"
import { addSeconds } from "../../common/date/addSeconds"

type GoogleAccessToken = google.accounts.oauth2.TokenResponse & {
  created_at: number
}

const CANCEL_SKIP_REASONS: readonly string[] = [
  "auto_cancel",
  "user_cancel",
  "tap_outside",
]

export const googleAccessTokenSignal = signal<GoogleAccessToken | undefined>({})

export const clearGoogleAccessToken = () => {
  googleAccessTokenSignal.update(SIGNAL_RESET)
}

export const consentShownSignal = signal({
  default: false,
})

export const requestGoogleAccessToken = async (
  gsi: typeof google,
  scopes: string[],
  clientId: string,
) => {
  return await new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      /**
       * @see https://developers.google.com/identity/oauth2/web/reference/js-reference#google.accounts.oauth2.initTokenClient
       */
      const tokenClient = gsi.accounts.oauth2.initTokenClient({
        client_id: clientId,
        /**
         * In case user is using different google account, we
         * want to make sure he uses the right account.
         */
        prompt: "select_account",
        scope: scopes.join(" "),
        callback: resolve,
        error_callback: reject,
      })

      tokenClient.requestAccessToken({})
    },
  )
}

/** Google's answer when the user closes its consent screen with "Cancel". */
const ACCESS_DENIED_ERROR = "access_denied"

const POPUP_BLOCKED_MESSAGE =
  "Google's window could not open. Allow pop-ups for oboku, then try again."

export const isPopupClosedError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "type" in error &&
  error.type === "popup_closed"

/**
 * Opens Google's popup code flow, whose code the API exchanges for a refresh
 * token. Closing the popup or cancelling the consent screen rejects with a
 * `CancelError`.
 *
 * @see https://developers.google.com/identity/oauth2/web/reference/js-reference#google.accounts.oauth2.initCodeClient
 */
export const requestGoogleAuthorizationCode = ({
  gsi,
  scopes,
  clientId,
}: {
  gsi: {
    accounts: {
      oauth2: Pick<typeof google.accounts.oauth2, "initCodeClient">
    }
  }
  scopes: string[]
  clientId: string
}) =>
  new Promise<string>(function requestCodeFromPopup(resolve, reject) {
    const codeClient = gsi.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: scopes.join(" "),
      ux_mode: "popup",
      select_account: true,
      callback: function receiveCodeResponse(response) {
        if (response.error === ACCESS_DENIED_ERROR) {
          reject(new CancelError())

          return
        }

        if (response.error) {
          reject(new Error(response.error_description || response.error))

          return
        }

        resolve(response.code)
      },
      error_callback: function rejectPopupFailure(error) {
        const isPopupBlocked = error.type === "popup_failed_to_open"

        if (isPopupClosedError(error)) {
          reject(new CancelError())

          return
        }

        reject(isPopupBlocked ? new Error(POPUP_BLOCKED_MESSAGE) : error)
      },
    })

    codeClient.requestCode()
  })

export const hasGrantedPermissions = (
  gsi: typeof google,
  accessToken: google.accounts.oauth2.TokenResponse,
  scopes: string[],
) => {
  const firstScope = scopes[0]

  if (!firstScope) return true

  return gsi.accounts.oauth2.hasGrantedAllScopes(
    accessToken,
    firstScope,
    ...scopes,
  )
}

export const getTokenExpirationDate = (accessToken: GoogleAccessToken) => {
  const expiresInSeconds = Number.parseInt(accessToken.expires_in, 10)

  return addSeconds(accessToken.created_at, expiresInSeconds)
}

export const signInWithGooglePrompt = (clientId: string) =>
  gsiOrThrow$.pipe(
    switchMap((gsi) => {
      const signInWithPopup =
        new Promise<google.accounts.id.CredentialResponse>(
          (resolve, reject) => {
            gsi.accounts.id.initialize({
              client_id: clientId,
              context: "signin",
              ux_mode: "popup",
              use_fedcm_for_prompt: false,
              callback: (response) => {
                resolve(response)
              },
            })

            gsi.accounts.id.prompt((notification) => {
              if (notification.isSkippedMoment()) {
                const skippedReason = notification.getSkippedReason()

                if (CANCEL_SKIP_REASONS.includes(skippedReason)) {
                  return reject(new CancelError())
                }

                console.warn(
                  `Google sign in skipped with reason: ${skippedReason}`,
                )

                return reject(
                  new Error(
                    "Google sign in was skipped. If this error persists make sure your browser is not blocking this site's third party sign-in.",
                  ),
                )
              }

              if (notification.isDismissedMoment()) {
                reject(new CancelError())
              }
            })
          },
        )

      return from(signInWithPopup)
    }),
  )

export const useAccessToken = () => {
  return useSignalValue(googleAccessTokenSignal)
}
