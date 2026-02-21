import { useCallback, useEffect, useState } from "react"
import { combineLatest, tap } from "rxjs"
import { syncSignal } from "./states"
import { triggerReplication$ } from "./triggerReplication"
import { useReplicateCollection } from "./useReplicateCollection"
import { useSignalValue, useSubscribe } from "reactjrx"
import { authStateSignal } from "../../auth/states.web"
import { useDatabase } from "../RxDbProvider"
import { useNetworkState } from "react-use"
import { useWatchAndFixConflicts } from "./conflicts/useWatchAndFixConflicts"
import { configuration } from "../../config/configuration"
import type { RxCouchDBReplicationState } from "rxdb/dist/types/plugins/replication-couchdb"

export const useBackgroundReplication = () => {
  const { db: database } = useDatabase()
  const { online } = useNetworkState()
  const { accessToken: token, dbName } = useSignalValue(authStateSignal) ?? {}
  const replicateBook = useReplicateCollection()
  const replicateTag = useReplicateCollection()
  const replicateCollection = useReplicateCollection()
  const replicateLink = useReplicateCollection()
  const replicateSettings = useReplicateCollection()
  const replicateDatasource = useReplicateCollection()
  const replicateSecret = useReplicateCollection()
  const isAuthenticated = !!token
  const [replicationStates, setReplicationStates] = useState<
    RxCouchDBReplicationState<unknown>[]
  >([])

  useWatchAndFixConflicts()

  const triggerReplication = useCallback(
    () =>
      triggerReplication$.pipe(
        tap(() => {
          replicationStates.forEach((state) => {
            state?.reSync()
          })
        }),
      ),
    [replicationStates],
  )

  useSubscribe(triggerReplication)

  const updateSyncSignal = useCallback(
    () =>
      combineLatest(replicationStates.map((state) => state.active$)).pipe(
        tap((active) => {
          syncSignal.update((state) => ({
            ...state,
            active: active.reduce((acc, value) => (value ? acc + 1 : acc), 0),
          }))
        }),
      ),
    [replicationStates],
  )

  useSubscribe(updateSyncSignal)

  useEffect(() => {
    if (!database || !dbName) return

    const states = [
      replicateBook({
        collection: database.book,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI,
      }),
      replicateDatasource({
        collection: database.datasource,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_2,
      }),
      replicateTag({
        collection: database?.tag,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_2,
      }),
      replicateLink({
        collection: database.link,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_3,
      }),
      replicateSettings({
        collection: database.settings,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_3,
      }),
      replicateCollection({
        collection: database.obokucollection,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_4,
      }),
      replicateSecret({
        collection: database.secret,
        dbName,
        live: true,
        host: configuration.API_COUCH_URI_4,
      }),
    ]

    setReplicationStates(states)

    return () => {
      states.forEach((state) => {
        state.remove()
      })
    }
  }, [
    database,
    replicateBook,
    replicateDatasource,
    replicateTag,
    replicateLink,
    replicateSettings,
    replicateCollection,
    replicateSecret,
    dbName,
  ])

  useEffect(() => {
    if (!online || !isAuthenticated) return

    replicationStates.forEach((state) => {
      state.start()
    })

    return () => {
      replicationStates.forEach((state) => {
        state.pause()
      })
    }
  }, [online, isAuthenticated, replicationStates])
}
