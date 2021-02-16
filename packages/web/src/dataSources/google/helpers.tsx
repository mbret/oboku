import { waitFor } from '../../misc/utils'
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Report } from '../../report'

type ContextValue = [
  typeof gapi | undefined,
  'loading' | 'signedOut' | 'signedIn',
  () => Promise<typeof gapi | undefined>
]

const defaultContextValue: ContextValue = [undefined, 'loading', async () => undefined]

const GoogleAPIContext = React.createContext(defaultContextValue)

const SCOPE = `https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly`
// const SCOPE = `https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file`

/**
 * 
 * @see https://developers.google.com/drive/api/v3/search-files
 */
export const listFiles = (googleAuth, searchTerm) => {

}

export const GoogleApiProvider: FC = ({ children }) => {
  const [googleApi, setGoogleApi] = useState<typeof gapi | undefined>(undefined)
  const isSigning = useRef(false)
  const [contextValue, setContextValue] = useState(defaultContextValue)
  const [isSigned, setIsSigned] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.onload = () => {
      setGoogleApi(window.gapi);
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (googleApi) {
      window.gapi.load('picker', () => { })
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client
            .init({
              'clientId': "325550353363-vklpik5kklrfohg1vdrkvjp1n8dopnrd.apps.googleusercontent.com",
              'scope': SCOPE,
              'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            })

          const onSignIn = (signedIn: boolean) => {
            setIsSigned(signedIn)
          }

          googleApi.auth2.getAuthInstance().isSignedIn.listen(onSignIn)

          // handle initial state
          onSignIn(googleApi.auth2.getAuthInstance().isSignedIn.get())

          // @ts-ignore
          window.googleApi = googleApi
          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      });
    }
  }, [googleApi])

  useEffect(() => {

    /**
     * Will signin and return the gapi if success, otherwise undefined
     */
    const signIn = async (): Promise<typeof gapi | undefined> => {
      if (isSigning.current) {
        await waitFor(10)
        return await signIn()
      }
      isSigning.current = true
      try {
        // await googleApi?.auth2.getAuthInstance().signIn({ prompt: 'consent' })
        await googleApi?.auth2.getAuthInstance().signIn({})
        return googleApi
      } catch (e) {
        throw e
      } finally {
        isSigning.current = false
      }
    }

    setContextValue([
      isSigned ? googleApi : undefined,
      isReady
        ? isSigned ? 'signedIn' : 'signedOut'
        : 'loading',
      signIn
    ])
  }, [googleApi, isSigned, isReady])

  return (
    <GoogleAPIContext.Provider value={contextValue}>
      {children}
    </GoogleAPIContext.Provider>
  )
}

export const useGetLazySignedGapi = () => {
  const [signedGoogleApi, , signIn] = useContext(GoogleAPIContext)

  const getter = useCallback(async () => {
    const gapi = signedGoogleApi || await signIn()
    if (gapi && gapi.auth2.getAuthInstance().isSignedIn.get()) {
      if (!gapi.auth2.getAuthInstance().currentUser.get().hasGrantedScopes(SCOPE)) {
        await gapi.auth2.getAuthInstance().currentUser.get().grant({ scope: SCOPE })
      }

      return {
        gapi: gapi,
        credentials: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse()
      }
    }
  }, [signedGoogleApi, signIn])

  return [getter, signedGoogleApi] as [typeof getter, typeof signedGoogleApi]
}

export const useGetCredentials = () => {
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useCallback(async () => {
    try {
      const auth = (await getLazySignedGapi())?.credentials

      if (!auth) throw new Error('unknown')
      
      return { data: auth as unknown as { [key: string]: string } }
    } catch (e) {
      if (e?.error === 'popup_closed_by_user') {
        return { isError: true, reason: 'cancelled' } as { isError: true, reason: 'cancelled' }
      }
      if (e?.error === 'popup_blocked_by_browser') {
        return { isError: true, reason: 'popupBlocked' } as { isError: true, reason: 'popupBlocked' }
      }
      throw e
    }
  }, [getLazySignedGapi])
}

export const extractIdFromResourceId = (resourceId: string) => resourceId.replace(`drive-`, ``)