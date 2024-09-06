import { ObokuPluginError } from "../../types"
import { catchError, first, from, mergeMap, of, tap } from "rxjs"
import {
  accessTokenSignal,
  consentShownSignal,
  hasGrantedPermissions,
  hasTokenAccessAtLeast10mnLeft,
  requestGoogleAccessToken
} from "./auth"
import { Report } from "../../../debug/report.shared"
import { useGoogleScripts } from "./scripts"

const isPopupClosedError = (error: unknown) => {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "popup_closed"
  )
}

export const useAccessToken = ({
  requestPopup
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { getGoogleScripts } = useGoogleScripts()

  const requestToken = ({ scope }: { scope: string[] }) =>
    getGoogleScripts().pipe(
      first(),
      mergeMap(([gsi]) => {
        const firstScope = scope[0]
        const accessToken = accessTokenSignal.getValue()

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

        Report.info(`google token invalid, requesting new one`)

        return from(requestPopup()).pipe(
          tap((confirmed) => {
            if (!confirmed) throw new ObokuPluginError({ code: "cancelled" })
          }),
          mergeMap(() => {
            consentShownSignal.setValue(true)

            return from(requestGoogleAccessToken(gsi, scope)).pipe(
              mergeMap((accessToken) => {
                consentShownSignal.setValue(false)

                if (accessToken.error) {
                  Report.error(`google access token error`, accessToken)

                  throw new Error(accessToken.error)
                }

                if (!hasGrantedPermissions(gsi, accessToken, scope)) {
                  throw new Error("not enough permissions")
                }

                const googleAccessToken = {
                  ...accessToken,
                  created_at: Date.now()
                }

                accessTokenSignal.setValue(googleAccessToken)

                return of(googleAccessToken)
              })
            )
          })
        )
      }),
      catchError((e) => {
        consentShownSignal.setValue(false)

        if (isPopupClosedError(e)) {
          throw new ObokuPluginError({ code: "cancelled" })
        }

        throw e
      })
    )

  return { requestToken }
}
