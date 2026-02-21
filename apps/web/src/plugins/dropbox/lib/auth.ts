import { DropboxAuth } from "dropbox"
import { ObokuPluginError } from "../../../errors/errors.shared"
import { ROUTES } from "../../../navigation/routes"
import { configuration } from "../../../config/configuration"
import { signal } from "reactjrx"

const defaultWindowOptions = {
  toolbar: "no",
  menubar: "no",
}

export const dropboxAuthSignal = signal<DropboxAuth | undefined>({})

configuration.subscribe(() => {
  if (configuration.DROPBOX_CLIENT_ID) {
    dropboxAuthSignal.getValue()?.setClientId(configuration.DROPBOX_CLIENT_ID)
  }
})

const isAccessTokenStillSufficient = () => {
  const accessTokenExpiresAt: Date | undefined = dropboxAuthSignal
    .getValue()
    ?.getAccessTokenExpiresAt()
  const currentTime = Date.now()
  const hours =
    Math.abs((accessTokenExpiresAt?.getTime() || 0) - currentTime) / 36e5

  if (
    accessTokenExpiresAt &&
    accessTokenExpiresAt.getTime() > currentTime &&
    hours >= 1
  )
    return true

  return false
}

/**
 * Token is valid for about 4 hours
 */
export const authUser = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  return new Promise<DropboxAuth>((resolve, reject) => {
    ;(async () => {
      let timedOut = false
      let listenToPopupCloseInterval: ReturnType<typeof setInterval>
      let listenToPopupTimeoutTimeout: ReturnType<typeof setTimeout>

      const dropboxAuth =
        dropboxAuthSignal.getValue() ??
        new DropboxAuth({
          clientId: configuration.DROPBOX_CLIENT_ID,
        })

      dropboxAuthSignal.update(dropboxAuth)

      // when there is at least an hour left of authentication, the server should be able
      // to handle it without for even long sync. Otherwise we should ask user credentials again
      if (isAccessTokenStillSufficient()) return resolve(dropboxAuth)

      const redirectUri = new URL(
        ROUTES.AUTH_CALLBACK,
        window.location.origin,
      ).toString()
      const usePKCE = true
      const authType = "code"
      const tokenAccessType = "online"
      const state = Math.random().toString(36).substring(7)
      try {
        const authUrl = await dropboxAuth.getAuthenticationUrl(
          redirectUri,
          state,
          authType,
          tokenAccessType,
          undefined,
          "user",
          usePKCE,
        )

        const confirmed = await requestPopup()

        if (!confirmed) throw new ObokuPluginError({ code: "cancelled" })

        const _oauthWindow = window.open(
          authUrl.toString(),
          "DropboxOAuth",
          (
            Object.keys(
              defaultWindowOptions,
            ) as (keyof typeof defaultWindowOptions)[]
          )
            .map((key) => `${key}=${defaultWindowOptions[key]}`)
            .join(","),
        )

        _oauthWindow?.focus()

        /**
         * The function in charge of handling the redirect once the popup has completed.
         */
        const handleRedirect = async (event: MessageEvent) => {
          if (timedOut) return

          if (
            event.isTrusted &&
            event.origin === window.location.origin &&
            event.data?.source === "oauth-redirect"
          ) {
            cleanup()
            const urlParams = new URLSearchParams(event.data?.params || "")
            const code = urlParams.get("code")

            try {
              const response = await dropboxAuth.getAccessTokenFromCode(
                redirectUri,
                code || "",
              )

              if (timedOut) return

              const { result } = response as any

              dropboxAuth.setAccessToken(result.access_token)
              dropboxAuth.setRefreshToken(result.refresh_token)
              dropboxAuth.setAccessTokenExpiresAt(
                new Date(Date.now() + result.expires_in * 1000),
              )

              resolve(dropboxAuth)
            } catch (e) {
              reject(e)
            }
          }
        }

        const cleanup = () => {
          clearInterval(listenToPopupCloseInterval)
          clearTimeout(listenToPopupTimeoutTimeout)
          window.removeEventListener("message", handleRedirect)
        }

        window.addEventListener("message", handleRedirect, false)

        listenToPopupTimeoutTimeout = setTimeout(() => {
          timedOut = true

          cleanup()

          reject(new Error("Request timed out"))
        }, 1000 * 60)

        listenToPopupCloseInterval = setInterval(() => {
          if (_oauthWindow?.closed) {
            cleanup()

            reject(new ObokuPluginError({ code: "cancelled" }))
          }
        }, 1000)
      } catch (e) {
        reject(e)
      }
    })()
  })
}
