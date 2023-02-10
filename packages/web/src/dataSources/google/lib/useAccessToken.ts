import { useCallback, useRef } from "react"
import { CLIENT_ID } from "./constants"
import { AccessToken } from "./types"
import { useGoogle } from "./useGsiClient"
import { addSeconds, differenceInMinutes } from "date-fns"

export const useAccessToken = () => {
  const { lazyGsi, setAccessToken, accessToken } = useGoogle()
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
      )
        return accessTokenRef.current.token

      const accessToken = await new Promise<AccessToken>((resolve, reject) => {
        /**
         * @see https://developers.google.com/identity/oauth2/web/reference/js-reference#google.accounts.oauth2.initTokenClient
         */
        const tokenClient = gsi.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: scope.join(" "),
          callback: resolve,
          // prompt: "",
          error_callback: reject
        })

        tokenClient.requestAccessToken({})
      })

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
    },
    [lazyGsi, setAccessToken]
  )

  return { requestToken }
}
