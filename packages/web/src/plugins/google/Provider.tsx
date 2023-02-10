import { ObokuPlugin } from "@oboku/plugin-front"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { BlockingScreen } from "../../common/BlockingBackdrop"
import { createDeferrablePromise } from "./lib/createDeferrablePromise"
import { ContextValue, GoogleAPIContext } from "./lib/helpers"
import { AccessToken } from "./lib/types"
import { useLoadApi } from "./lib/useLoadApi"

export const Provider: ObokuPlugin["Provider"] = memo(({ children }) => {
  const { api, gsi } = useLoadApi()
  const [consentPopupShown, setConsentPopupShown] = useState(false)
  const lazyGsi = useRef(
    createDeferrablePromise<Awaited<ContextValue["lazyGsi"]>>()
  )
  const lazyGapi = useRef(
    createDeferrablePromise<Awaited<ContextValue["lazyGapi"]>>()
  )
  const [accessToken, setAccessToken] = useState<
    { token: AccessToken; createdAt: Date } | undefined
  >()

  useEffect(() => {
    if (api && gsi) {
      ;(async () => {
        try {
          await Promise.all([
            new Promise((resolve, reject) => {
              api.load("picker", { callback: resolve, onerror: reject })
            }),
            new Promise((resolve, reject) => {
              api.load("client", { callback: resolve, onerror: reject })
            })
          ])

          await window.gapi.client.init({
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
            ]
          })

          lazyGsi.current.resolve(gsi)
          lazyGapi.current.resolve(api)
        } catch (e) {
          lazyGsi.current.reject(e)
          lazyGapi.current.reject(e)
        }
      })()
    }
  }, [api, gsi])

  const values = useMemo(
    () => ({
      gsi,
      lazyGsi: lazyGsi.current.promise,
      lazyGapi: lazyGapi.current.promise,
      accessToken,
      setAccessToken,
      consentPopupShown,
      setConsentPopupShown
    }),
    [gsi, accessToken, setAccessToken, consentPopupShown, setConsentPopupShown]
  )

  return (
    <GoogleAPIContext.Provider value={values}>
      {children}
      {!!consentPopupShown && <BlockingScreen />}
    </GoogleAPIContext.Provider>
  )
})
