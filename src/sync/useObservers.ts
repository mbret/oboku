import { useCallback, useEffect } from "react"
import { RxChangeEvent, RxDocument, RxReplicationState, SyncOptions } from "rxdb"
import { useAuth, useIsAuthenticated, useSignOut } from "../auth/helpers"
import { API_SYNC_URL } from "../constants"
import { AuthDocType, AuthDocument, SettingsDocType, useDatabase } from "../rxdb"
import PouchDB from 'pouchdb'
import { useRecoilState, useSetRecoilState } from "recoil"
import { syncState } from "../library/states"
import { authState } from "../auth/authState"
import { settingsState } from "../settings/states"
import { useBooksObservers } from "../books/observers"
import { useTagsObservers } from "../tags/observers"
import { useLinksObservers } from "../links/observers"
import { useCollectionsObservers } from "../collections/observers"
import { useDataSourcesObservers } from "../dataSources/observers"
import { Subscription } from "rxjs"
import { lastAliveSyncState } from "./state"
import { useWatchAndFixConflicts } from "./useWatchAndFixConflicts"

type callback = Parameters<typeof PouchDB['sync']>[3]
type PouchError = NonNullable<Parameters<NonNullable<callback>>[0]>

export const useAuthStateReducer = () => {
  const setState = useSetRecoilState(authState);

  return useCallback((eventOrAction: RxChangeEvent<AuthDocType> | { operation: 'INIT', documentData: AuthDocument }) => {
    switch (eventOrAction.operation) {
      case 'INIT': {
        return setState(old => ({ ...old, ...eventOrAction.documentData.toJSON() }))
      }
      case 'UPDATE': {
        return setState(old => ({ ...old, ...eventOrAction.documentData }))
      }
    }
  }, [setState])
}

export const useSettingsStateReducer = () => {
  const setState = useSetRecoilState(settingsState);

  return useCallback((eventOrAction: RxChangeEvent<SettingsDocType> | { operation: 'INIT', documentData: RxDocument<SettingsDocType> }) => {
    switch (eventOrAction.operation) {
      case 'INIT': {
        return setState(old => ({ ...old, ...eventOrAction.documentData.toJSON() }))
      }
      case 'UPDATE': {
        return setState(old => ({ ...old, ...eventOrAction.documentData }))
      }
    }
  }, [setState])
}

export const useObservers = () => {
  const authReducer = useAuthStateReducer()
  const settingsReducer = useSettingsStateReducer()
  const database = useDatabase()
  const { token } = useAuth() || {}
  const isAuthenticated = useIsAuthenticated()
  const signOut = useSignOut()
  const [{ syncRefresh }, setSyncState] = useRecoilState(syncState)
  const setLastAliveSyncState = useSetRecoilState(lastAliveSyncState)

  useBooksObservers()
  useTagsObservers()
  useLinksObservers()
  useCollectionsObservers()
  useDataSourcesObservers()
  useWatchAndFixConflicts()
  
  useEffect(() => {
    let syncStates: (RxReplicationState | ReturnType<NonNullable<typeof database>['sync']>)[]
    let subscriptions: Subscription[] = []

    const attachEventsToSubscription = (state: typeof syncStates[number]) => {
      // state?.active$.subscribe((active: boolean) => {
      //   setSyncState(old => ({ ...old, isSyncing: active }))
      // })
      subscriptions.push(state?.alive$.subscribe(alive => {
        if (alive) {
          setLastAliveSyncState(Date.now())
        }
      }))
      // state?.change$.subscribe(data => console.warn(`sync change`, data))
      // state?.denied$.subscribe(data => console.warn(`sync denied`, data))
      subscriptions.push(state?.error$.subscribe((error: PouchError) => {
        console.warn(`sync error`, error)
        if (error.status === 401) {
          signOut()
        }
      }))
      // state?.complete$.subscribe(data => console.warn(`sync complete`, data))
      // state?.docs$.subscribe(data => console.warn(`sync docs`, data))
    }

    const syncOptions = (name: string): SyncOptions => ({
      remote: new PouchDB(API_SYNC_URL, {
        fetch: (url, opts) => {
          (opts?.headers as unknown as Map<string, string>).set('Authorization', `Bearer ${token}`)
          return PouchDB.fetch(url, opts)
        }
      }),
      direction: {
        pull: true,
        push: true,
      },
      options: {
        live: true,
        retry: true,
      },
    })

    if (isAuthenticated && database) {
      syncStates = [
        database?.sync({ syncOptions, collectionNames: ['tag', 'book', 'link', 'settings', 'datasource', 'obokucollection'] }),
      ]
      syncStates?.forEach(attachEventsToSubscription)
    }

    return () => {
      subscriptions?.forEach(sub => sub.unsubscribe())
      subscriptions = []
      syncStates?.forEach(state => state.cancel())
      syncStates = []
    }
  }, [database, signOut, isAuthenticated, token, syncRefresh, setSyncState, setLastAliveSyncState])

  useEffect(() => {
    const obs$ = database?.auth.$.subscribe(authReducer)
    const settingsObs$ = database?.settings.$.subscribe(settingsReducer)

    return () => {
      obs$?.unsubscribe()
      settingsObs$?.unsubscribe()
    }
  }, [database, authReducer, settingsReducer])
}