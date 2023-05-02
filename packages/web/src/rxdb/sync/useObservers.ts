import { useCallback, useEffect } from "react"
import { RxChangeEvent, RxDocument } from "rxdb"
import { useIsAuthenticated, useSignOut } from "../../auth/helpers"
import { API_COUCH_URI } from "../../constants"
import { SettingsDocType, useDatabase } from ".."
import PouchDB from "pouchdb"
import { useSetRecoilState } from "recoil"
import { settingsState } from "../../settings/states"
import { useBooksObservers } from "../../books/observers"
import { useLinksObservers } from "../../links/observers"
import { useCollectionsObservers } from "../../collections/observers"
import { useWatchAndFixConflicts } from "./useWatchAndFixConflicts"
import { useAuthState } from "../../auth/authState"
import { syncCollections } from "../replication/syncCollections"
import { useNetworkState } from "react-use"
import { useSyncState } from "../../library/states"

type callback = Parameters<(typeof PouchDB)["sync"]>[3]
type PouchError = NonNullable<Parameters<NonNullable<callback>>[0]>

export const useSettingsStateReducer = () => {
  const setState = useSetRecoilState(settingsState)

  return useCallback(
    (
      eventOrAction:
        | RxChangeEvent<SettingsDocType>
        | { operation: "INIT"; documentData: RxDocument<SettingsDocType> }
    ) => {
      switch (eventOrAction.operation) {
        case "INIT": {
          return setState((old) => ({
            ...old,
            ...eventOrAction.documentData.toJSON()
          }))
        }
        case "UPDATE": {
          return setState((old) => ({ ...old, ...eventOrAction.documentData }))
        }
      }
    },
    [setState]
  )
}

export const useObservers = () => {
  const settingsReducer = useSettingsStateReducer()
  const { db: database } = useDatabase()
  const { token, dbName } = useAuthState() || {}
  const isAuthenticated = useIsAuthenticated()
  const signOut = useSignOut()
  const { syncRefresh } = useSyncState()
  const { online } = useNetworkState()

  useBooksObservers()
  useLinksObservers()
  useCollectionsObservers()
  useWatchAndFixConflicts()

  useEffect(() => {
    const syncOptions = () => ({
      remote: new PouchDB(`${API_COUCH_URI}/${dbName}`, {
        fetch: (url, opts) => {
          ;(opts?.headers as unknown as Map<string, string>).set(
            "Authorization",
            `Bearer ${token}`
          )
          return PouchDB.fetch(url, opts)
        }
      }),
      direction: {
        pull: true,
        push: true
      },
      options: {
        live: true,
        retry: true
      }
    })

    if (isAuthenticated && database && online) {
      const syncState = syncCollections(
        [
          database.book,
          database.tag,
          database.link,
          database.settings,
          database.datasource,
          database.obokucollection
        ],
        syncOptions
      )

      const subscriptions = [
        // syncState.active$.subscribe((active: boolean) => {
        //   console.log(`SYNC active`, active)
        // }),
        syncState.alive$.subscribe((alive) => {
          console.log(`SYNC alive`, alive)
        }),
        // syncState.change$.subscribe((data) =>
        //   console.warn(`SYNC change`, data)
        // ),
        // syncState.complete$.subscribe((data) =>
        //   console.warn(`SYNC complete`, data)
        // ),
        syncState.error$.subscribe((error: PouchError) => {
          console.warn(`sync error`, error)
          // 403 -> forbidden access
          if (error.status === 401 || error.status === 403) {
            signOut()
          }
        })
      ]

      return () => {
        syncState?.cancel()
        subscriptions.forEach((subscription) => subscription.unsubscribe())
      }
    }
  }, [database, signOut, isAuthenticated, token, syncRefresh, dbName, online])

  useEffect(() => {
    const settingsObs$ = database?.settings.$.subscribe(settingsReducer)

    return () => {
      settingsObs$?.unsubscribe()
    }
  }, [database, settingsReducer])
}
