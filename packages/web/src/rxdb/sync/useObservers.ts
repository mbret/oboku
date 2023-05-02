import { useEffect } from "react"
import { useIsAuthenticated, useSignOut } from "../../auth/helpers"
import { API_COUCH_URI } from "../../constants"
import { useDatabase } from ".."
import PouchDB from "pouchdb"
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

export const useObservers = () => {
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
}
