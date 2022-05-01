import { useEffect } from "react"

export const AuthCallbackScreen = () => {
  useEffect(() => {
    // get the URL parameters which will include the auth token
    const params = window.location.search
    if (window.opener) {
      // send them to the opening window
      // @todo secure target origin
      // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
      window.opener.postMessage(
        {
          source: "oauth-redirect",
          params
        },
        `*`
      )
      // close the popup
      window.close()
    }
  }, [])

  return null
}
