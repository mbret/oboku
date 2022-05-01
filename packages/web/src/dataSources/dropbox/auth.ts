import { DropboxAuth } from "dropbox"
import { CLIENT_ID } from "./constants"

const defaultWindowOptions = {
  toolbar: "no",
  menubar: "no",
  width: 320,
  height: 600,
  top: 100,
  left: 100
}

// let lastDpx = new Dropbox({ clientId: CLIENT_ID })
let dropboxAuth = new DropboxAuth({ clientId: CLIENT_ID })

export const getLastDpx = () => dropboxAuth

const isAccessTokenStillSufficient = () => {
  const accessTokenExpiresAt: Date | undefined =
    dropboxAuth.getAccessTokenExpiresAt()
  const currentTime = new Date().getTime()
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
export const authUser = () => {
  return new Promise<
    DropboxAuth | { isError: true; error?: Error; reason: "cancelled" }
  >((resolve, reject) => {
    let timedOut = false
    let listenToPopupCloseInterval: ReturnType<typeof setInterval>
    let listenToPopupTimeoutTimeout: ReturnType<typeof setTimeout>

    // when there is at least an hour left of authentication, the server should be able
    // to handle it without for even long sync. Otherwise we should ask user credentials again
    if (isAccessTokenStillSufficient()) return resolve(dropboxAuth)

    const redirectUri = `${window.location.origin}/auth_callback`
    const usePKCE = true
    const authType = "code"
    const tokenAccessType = "online"
    const state = Math.random().toString(36).substring(7)
    const authUrl = dropboxAuth.getAuthenticationUrl(
      redirectUri,
      state,
      authType,
      tokenAccessType,
      undefined,
      "user",
      usePKCE
    )
    const _oauthWindow = window.open(
      authUrl,
      "DropboxOAuth",
      Object.keys(defaultWindowOptions)
        .map((key) => `${key}=${defaultWindowOptions[key]}`)
        .join(",")
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
            code || ""
          )
          if (timedOut) return
          const { result } = response as any

          console.log(result)

          dropboxAuth.setAccessToken(result.access_token)
          dropboxAuth.setRefreshToken(result.refresh_token)
          dropboxAuth.setAccessTokenExpiresAt(
            new Date(Date.now() + result.expires_in * 1000)
          )

          resolve(dropboxAuth)
        } catch (e) {
          reject(e)
        }
      }
      console.log(event)
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

    listenToPopupCloseInterval = setInterval(function () {
      if (_oauthWindow?.closed) {
        cleanup()

        resolve({ isError: true, reason: "cancelled" })
      }
    }, 1000)
  })
}
