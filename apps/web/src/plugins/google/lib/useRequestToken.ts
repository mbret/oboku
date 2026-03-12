import { catchError, from, mergeMap, of, tap } from "rxjs"
import {
  googleAccessTokenSignal,
  consentShownSignal,
  hasGrantedPermissions,
  hasTokenAccessAtLeast10mnLeft,
  requestGoogleAccessToken,
} from "../../../google/auth"
import { Logger } from "../../../debug/logger.shared"
import { useGoogleScripts } from "./scripts"
import { CancelError } from "../../../errors/errors.shared"

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
         * We return current token if it has at least 10mn left
         * and the scope is valid
         */
        if (accessToken) {
          if (
            (!firstScope ||
              (firstScope && hasGrantedPermissions(gsi, accessToken, scope))) &&
            hasTokenAccessAtLeast10mnLeft(accessToken)
          ) {
            return of(accessToken)
          }
        }

        Logger.info(`google token invalid, requesting new one`)

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
