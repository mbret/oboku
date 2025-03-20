import { signal } from "reactjrx"
import { CLIENT_ID } from "./constants"
import { addMinutes, addSeconds, isBefore } from "date-fns"

type GoogleAccessToken = google.accounts.oauth2.TokenResponse & {
  created_at: number
}

export const accessTokenSignal = signal<GoogleAccessToken | undefined>({
  default: undefined,
})

export const consentShownSignal = signal({
  default: false,
})

export const requestGoogleAccessToken = async (
  gsi: typeof google,
  scopes: string[],
) => {
  return await new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      /**
       * @see https://developers.google.com/identity/oauth2/web/reference/js-reference#google.accounts.oauth2.initTokenClient
       */
      const tokenClient = gsi.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
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
  const createdAtDate = new Date(accessToken.created_at)

  return addSeconds(createdAtDate, parseInt(accessToken.expires_in, 10))
}

export const hasTokenAccessAtLeast10mnLeft = (
  accessToken: GoogleAccessToken,
) => {
  const tenMinutesFromNow = addMinutes(new Date(), 10)
  const expirationDate = getTokenExpirationDate(accessToken)
  const hasAtLeastTenMinutesLeft = isBefore(tenMinutesFromNow, expirationDate)

  return hasAtLeastTenMinutesLeft
}
