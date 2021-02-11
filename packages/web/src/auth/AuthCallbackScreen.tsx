import { useEffect } from "react"

export const AuthCallbackScreen = () => {

  useEffect(() => {
    // get the URL parameters which will include the auth token
    const params = window.location.search;
    if (window.opener) {
      // send them to the opening window
      window.opener.postMessage({
        source: 'oauth-redirect',
        params
      });
      // close the popup
      window.close();
    }
  }, [])

  return null
}