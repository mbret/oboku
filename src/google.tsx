import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react'

type ContextValue = [typeof gapi | undefined, 'loading' | 'signedOut' | 'signedIn', () => void]
const defaultContextValue: ContextValue = [undefined, 'loading', () => { }]

const GoogleAPIContext = React.createContext(defaultContextValue)

const SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly'

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
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client
            .init({
              'clientId': "325550353363-vklpik5kklrfohg1vdrkvjp1n8dopnrd.apps.googleusercontent.com",
              'scope': SCOPE,
              'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            })

          const onSignIn = (signedIn: boolean) => {
            setIsSigned(signedIn)
          }
    
          googleApi.auth2.getAuthInstance().isSignedIn.listen(onSignIn)
    
          // handle initial state
          onSignIn(googleApi.auth2.getAuthInstance().isSignedIn.get())
    
          setIsReady(true)
        } catch (e) {
          console.error(e)
        }
      });
    }
  }, [googleApi])

  useEffect(() => {
    setContextValue([
      isSigned ? googleApi : undefined,
      isReady
        ? isSigned ? 'signedIn' : 'signedOut'
        : 'loading',
      async () => {
        if (isSigning.current) return
        isSigning.current = true
        try {
          await googleApi?.auth2.getAuthInstance().signIn()
        } catch (_) { }
        isSigning.current = false
      }
    ])
  }, [googleApi, isSigned, isReady])

  return (
    <GoogleAPIContext.Provider value={contextValue}>
      {children}
    </GoogleAPIContext.Provider>
  )
}

const useGapi = () => {
  const [signedGoogleApi, state, signIn] = useContext(GoogleAPIContext)

  console.log('useGapi', signedGoogleApi, state)
  useEffect(() => {
    if (state === 'signedOut') {
      signIn()
    }
  }, [state, signIn])

  return signedGoogleApi
}

export const useFiles = (options: { q?: string }) => {
  const gapi = useGapi()
  const [cumulativeData, setCumulativeData] = useState<any[] | undefined>(undefined)
  const [isDone, setIsDone] = useState(false)
  const [nextToken, setNextToken] = useState(undefined)
  const { q } = options

  useEffect(() => {
    setNextToken(undefined)
    setCumulativeData(undefined)
    setIsDone(false)
  }, [q])

  useEffect(() => {
    (async () => {
      try {
        // setIsFetchingGoogleDriveFiles(true)
        const response = await gapi?.client.drive.files
          .list({
            pageSize: 1000,
            // fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
            pageToken: nextToken,
            fields: '*',
            includeItemsFromAllDrives: false,
            // q: `mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip' and visibility='public'`,
            // q: `(mimeType='application/epub+zip') and sharedWithMe`,
            q: `(mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip') and visibility = 'anyoneWithLink'`,
            spaces: 'drive',
            ...q && {
              q,
            }
          })
        if (response) {
          const res = JSON.parse(response.body)
          setCumulativeData(v => [...v || [], ...res.files])
          console.log(res)
          if (res.nextPageToken) {
            setNextToken(res.nextPageToken)
          } else {
            setIsDone(true)
          }
        }
        console.log(response)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [gapi, q, nextToken])

  return isDone ? cumulativeData : undefined
}

export const useFolders = (options: { parent: string }) => {
  return useFiles({
    // q: `(mimeType='application/vnd.google-apps.folder') and '0AM15DohwdqHCUk9PVA' in parents and visibility = 'anyoneWithLink'`
    q: `(mimeType='application/vnd.google-apps.folder') and '${options.parent}' in parents and visibility = 'anyoneWithLink'`
    // q: `(mimeType='application/vnd.google-apps.folder') and visibility = 'anyoneWithLink'`
  })
}

