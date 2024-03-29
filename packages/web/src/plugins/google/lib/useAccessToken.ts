import { useCallback, useRef } from "react"
import { CLIENT_ID } from "./constants"
import { AccessToken } from "./types"
import { useGoogle } from "./useGsiClient"
import { addSeconds, differenceInMinutes } from "date-fns"
import { ObokuPluginError } from "../../plugin-front"

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
  const { lazyGsi, setAccessToken, accessToken, setConsentPopupShown } =
    useGoogle()
  const accessTokenRef = useRef(accessToken)
  accessTokenRef.current = accessToken

  const requestToken = useCallback(
    async ({ scope }: { scope: string[] }) => {
      const gsi = await lazyGsi

      const firstScope = scope[0]

      if (
        accessTokenRef.current?.token &&
        differenceInMinutes(
          addSeconds(
            accessTokenRef.current.createdAt,
            parseInt(accessTokenRef.current.token.expires_in)
          ),
          new Date()
        ) > 10 &&
        firstScope &&
        gsi.accounts.oauth2.hasGrantedAllScopes(
          accessTokenRef.current.token,
          firstScope,
          ...scope
        )
      ) {
        return accessTokenRef.current.token
      }

      const confirmed = await requestPopup()

      if (!confirmed) throw new ObokuPluginError({ code: "cancelled" })

      setConsentPopupShown(true)

      try {
        const accessToken = await new Promise<AccessToken>(
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
              scope: scope.join(" "),
              callback: resolve,
              // prompt: "",
              error_callback: reject
            })

            tokenClient.requestAccessToken({})
          }
        )

        setConsentPopupShown(false)

        if (accessToken.error) {
          console.error(
            accessToken.error,
            accessToken.error_description,
            accessToken.error_uri
          )
          throw new Error(accessToken.error)
        }

        if (
          firstScope &&
          !gsi.accounts.oauth2.hasGrantedAllScopes(
            accessToken,
            firstScope,
            ...scope
          )
        ) {
          throw new Error("not enough permissions")
        }

        setAccessToken({ token: accessToken, createdAt: new Date() })

        return accessToken
      } catch (e) {
        setConsentPopupShown(false)

        if (isPopupClosedError(e)) {
          throw new ObokuPluginError({ code: "cancelled" })
        }

        throw e
      }
    },
    [lazyGsi, setAccessToken, requestPopup, setConsentPopupShown]
  )

  return { requestToken }
}
