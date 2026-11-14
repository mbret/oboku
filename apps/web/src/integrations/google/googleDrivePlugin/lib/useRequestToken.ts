import { useQueryClient } from "@tanstack/react-query"
import { catchError, from, map, mergeMap, of, tap } from "rxjs"
import {
  googleAccessTokenSignal,
  consentShownSignal,
  hasGrantedPermissions,
  getTokenExpirationDate,
  isPopupClosedError,
  requestGoogleAccessToken,
} from "../../auth"
import { mintGoogleAccessToken } from "../../connection/mintGoogleAccessToken"
import { Logger } from "../../../../debug/logger.shared"
import { useGoogleScripts } from "./scripts"
import { CancelError } from "../../../../errors/errors.shared"
import { useConfig } from "../../../../config/useConfig"
import { useHttpClientApi } from "../../../../http"
import { getActiveProfileId } from "../../../../profiles/active/activeProfileId"
import { hasMinimumValidityLeft } from "../../../plugins/common/tokenValidity"

/**
 * Gets a Drive access token, in this order: the token in use while it stays
 * valid, one minted from the user's Google connection, then Google's sign-in
 * popup.
 */
export const useRequestToken = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { data: config } = useConfig()
  const { getGoogleScripts } = useGoogleScripts()
  const httpClientApi = useHttpClientApi()
  const queryClient = useQueryClient()

  const requestTokenFromConnection = ({
    gapiInstance,
    scope,
  }: {
    gapiInstance: typeof gapi
    scope: string[]
  }) => {
    if (!config?.FEATURE_GOOGLE_CONNECTION_ENABLED) return of(null)

    return from(
      mintGoogleAccessToken({
        httpClientApi,
        queryClient,
        profileId: getActiveProfileId(),
      }),
    ).pipe(
      map(function keepTokenGrantingScope(accessToken) {
        const isScopeGranted =
          !!accessToken && hasGrantedPermissions(accessToken, scope)

        return isScopeGranted ? accessToken : null
      }),
      tap(function rememberTokenForDrive(accessToken) {
        if (!accessToken) return

        // Google's sign-in sets its own tokens on gapi; a minted one needs setting.
        gapiInstance.client.setToken({ access_token: accessToken.access_token })
        googleAccessTokenSignal.update(accessToken)
      }),
    )
  }

  const requestTokenFromPopup = ({
    gsi,
    scope,
  }: {
    gsi: typeof google
    scope: string[]
  }) =>
    from(requestPopup()).pipe(
      tap(function cancelUnlessConfirmed(confirmed) {
        if (!confirmed) throw new CancelError()
      }),
      mergeMap(function openGoogleSignIn() {
        consentShownSignal.update(true)

        return from(
          requestGoogleAccessToken(gsi, scope, config?.GOOGLE_CLIENT_ID ?? ""),
        ).pipe(
          mergeMap(function keepGrantedToken(accessToken) {
            consentShownSignal.update(false)

            if (accessToken.error) {
              Logger.error(`google access token error`, accessToken)

              throw new Error(accessToken.error)
            }

            if (!hasGrantedPermissions(accessToken, scope)) {
              throw new Error("not enough permissions")
            }

            const googleAccessToken = {
              ...accessToken,
              created_at: Date.now(),
            }

            googleAccessTokenSignal.update(googleAccessToken)

            return of(googleAccessToken)
          }),
        )
      }),
    )

  const requestToken = ({ scope }: { scope: string[] }) =>
    getGoogleScripts().pipe(
      mergeMap(function reuseOrRequestToken({ gsi, gapi: gapiInstance }) {
        const accessToken = googleAccessTokenSignal.getValue()
        const minimumValidityMs = config?.MINIMUM_TOKEN_VALIDITY_MS

        /**
         * We return current token if it has enough time left for downstream
         * requests, based on the shared web configuration threshold, and the
         * scope is valid.
         */
        if (accessToken && minimumValidityMs !== undefined) {
          if (
            hasGrantedPermissions(accessToken, scope) &&
            hasMinimumValidityLeft({
              expiresAt: getTokenExpirationDate(accessToken),
              minimumValidityMs,
            })
          ) {
            return of(accessToken)
          }
        }

        Logger.info(
          `google token invalid or below ${minimumValidityMs}ms validity, requesting new one`,
        )

        return requestTokenFromConnection({ gapiInstance, scope }).pipe(
          mergeMap(function fallBackToPopup(connectionToken) {
            if (connectionToken) return of(connectionToken)

            return requestTokenFromPopup({ gsi, scope })
          }),
        )
      }),
      catchError(function cancelOnClosedPopup(e) {
        consentShownSignal.update(false)

        if (isPopupClosedError(e)) {
          throw new CancelError()
        }

        throw e
      }),
    )

  return { requestToken }
}
