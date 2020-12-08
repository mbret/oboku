import { useCallback, useEffect } from "react"
import { RxChangeEvent, RxDocument, RxReplicationState } from "rxdb"
import { useAuth, useIsAuthenticated, useSignOut } from "./auth/helpers"
import { API_SYNC_URL, API_SYNC_POLL1_URL, API_SYNC_POLL_2_URL } from "./constants"
import { AuthDocType, AuthDocument, LibraryDocType, SettingsDocType, useDatabase } from "./rxdb"
import PouchDB from 'pouchdb'
import { useRecoilState, useSetRecoilState } from "recoil"
import { libraryState, syncState } from "./library/states"
import { authState } from "./auth/authState"
import { settingsState } from "./settings/states"
import { useBooksObservers } from "./books/observers"
import { useTagsObservers } from "./tags/observers"
import { useLinksObservers } from "./links/observers"
import { useCollectionsObservers } from "./collections/observers"
import { useDataSourcesObservers } from "./dataSources/observers"

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

export const useLibraryStateReducer = () => {
  const setState = useSetRecoilState(libraryState);

  return useCallback((eventOrAction: RxChangeEvent<LibraryDocType> | { operation: 'INIT', documentData: RxDocument<LibraryDocType> }) => {
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
  const libraryReducer = useLibraryStateReducer()
  const settingsReducer = useSettingsStateReducer()
  const database = useDatabase()
  const { token } = useAuth() || {}
  const isAuthenticated = useIsAuthenticated()
  const [signOut] = useSignOut()
  const [{ syncRefresh }, setSyncState] = useRecoilState(syncState)

  useBooksObservers()
  useTagsObservers()
  useLinksObservers()
  useCollectionsObservers()
  useDataSourcesObservers()

  useEffect(() => {
    let syncStates: (RxReplicationState | ReturnType<NonNullable<typeof database>['sync']>)[]

    const attachEventsToSubscription = (state: typeof syncStates[number]) => {
      // state?.active$.subscribe((active: boolean) => {
      //   setSyncState(old => ({ ...old, isSyncing: active }))
      // })
      // state?.alive$.subscribe(data => console.warn(`sync alive(${data})`))
      // state?.change$.subscribe(data => console.warn(`sync change`, data))
      // state?.denied$.subscribe(data => console.warn(`sync denied`, data))
      state?.error$.subscribe((error: PouchError) => {
        console.warn(`sync error`, error)
        if (error.status === 401) {
          signOut()
        }
      })
      // state?.complete$.subscribe(data => console.warn(`sync complete`, data))
      // state?.docs$.subscribe(data => console.warn(`sync docs`, data))
    }

    const syncOptions = (name: string) => ({
      remote: new PouchDB(['tag', 'book', 'link'].includes(name) ? API_SYNC_POLL1_URL : API_SYNC_POLL_2_URL, {
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
        database?.sync({ syncOptions, collectionNames: ['tag', 'book', 'link', 'settings', 'c_ollection', 'datasource'] })
      ]
      syncStates?.forEach(attachEventsToSubscription)
    }

    return () => {
      syncStates?.forEach(state => state.cancel())
    }
  }, [database, signOut, isAuthenticated, token, syncRefresh, setSyncState])

  useEffect(() => {
    const obs$ = database?.auth.$.subscribe(authReducer)
    const libraryObs$ = database?.library.$.subscribe(libraryReducer)
    const settingsObs$ = database?.settings.$.subscribe(settingsReducer)

    return () => {
      obs$?.unsubscribe()
      settingsObs$?.unsubscribe()
      libraryObs$?.unsubscribe()
    }
  }, [database, libraryReducer, authReducer, settingsReducer])
}