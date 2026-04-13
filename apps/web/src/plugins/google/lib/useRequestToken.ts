import { catchError, from, mergeMap, of, tap } from "rxjs"
import {
  googleAccessTokenSignal,
  consentShownSignal,
  hasGrantedPermissions,
  getTokenExpirationDate,
  requestGoogleAccessToken,
} from "../../../google/auth"
import { Logger } from "../../../debug/logger.shared"
import { useGoogleScripts } from "./scripts"
import { CancelError } from "../../../errors/errors.shared"
import { configuration } from "../../../config/configuration"
import { hasMinimumValidityLeft } from "../../tokenValidity"

const isPopupClosedError = (error: unknown) => {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "popup_closed"
  )
}

export const useRequestToken = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { getGoogleScripts } = useGoogleScripts()

  const requestToken = ({ scope }: { scope: string[] }) =>
    getGoogleScripts().pipe(
      mergeMap(([gsi]) => {
        const firstScope = scope[0]
        const accessToken = googleAccessTokenSignal.getValue()

        /**
         * We return current token if it has enough time left for downstream
         * requests, based on the shared web configuration threshold, and the
         * scope is valid.
         */
        if (accessToken) {
          if (
            (!firstScope ||
              (firstScope && hasGrantedPermissions(gsi, accessToken, scope))) &&
            hasMinimumValidityLeft({
              expiresAt: getTokenExpirationDate(accessToken),
              minimumValidityMs: configuration.MINIMUM_TOKEN_VALIDITY_MS,
            })
          ) {
            return of(accessToken)
          }
        }

        Logger.info(
          `google token invalid or below ${configuration.MINIMUM_TOKEN_VALIDITY_MS}ms validity, requesting new one`,
        )

        return from(requestPopup()).pipe(
          tap((confirmed) => {
            if (!confirmed) throw new CancelError()
          }),
          mergeMap(() => {
            consentShownSignal.setValue(true)

            return from(requestGoogleAccessToken(gsi, scope)).pipe(
              mergeMap((accessToken) => {
                consentShownSignal.setValue(false)

                if (accessToken.error) {
                  Logger.error(`google access token error`, accessToken)

                  throw new Error(accessToken.error)
                }

                if (!hasGrantedPermissions(gsi, accessToken, scope)) {
                  throw new Error("not enough permissions")
                }

                const googleAccessToken = {
                  ...accessToken,
                  created_at: Date.now(),
                }

                googleAccessTokenSignal.setValue(googleAccessToken)

                return of(googleAccessToken)
              }),
            )
          }),
        )
      }),
      catchError((e) => {
        consentShownSignal.setValue(false)

        if (isPopupClosedError(e)) {
          throw new CancelError()
        }

        throw e
      }),
    )

  return { requestToken }
}
