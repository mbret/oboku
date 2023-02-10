import React, {
  FC,
  memo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { useLoadApi } from "./useLoadApi"
import { createDeferrablePromise } from "./createDeferrablePromise"
import { AccessToken } from "./types"

type ContextValue = {
  gsi: typeof google | undefined
  lazyGsi: Promise<typeof google>
  lazyGapi: Promise<typeof gapi>
  accessToken?: { token: AccessToken; createdAt: Date }
  setAccessToken: ReturnType<
    typeof useState<{ token: AccessToken; createdAt: Date } | undefined>
  >[1]
}

export const GoogleAPIContext = React.createContext<ContextValue>({
  gsi: undefined,
  lazyGsi: new Promise(() => {}),
  lazyGapi: new Promise(() => {}),
  setAccessToken: () => {}
})

export const GoogleApiProvider: FC<{ children: ReactNode }> = memo(
  ({ children }) => {
    const { api, gsi } = useLoadApi()
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
        setAccessToken
      }),
      [gsi, accessToken, setAccessToken]
    )

    return (
      <GoogleAPIContext.Provider value={values}>
        {children}
      </GoogleAPIContext.Provider>
    )
  }
)

export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)
