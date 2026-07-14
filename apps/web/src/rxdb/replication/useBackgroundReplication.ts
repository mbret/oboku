import { useCallback, useEffect, useState } from "react"
import { combineLatest, tap } from "rxjs"
import { syncSignal } from "./states"
import { triggerReplication$ } from "./triggerReplication"
import { useReplicateCollection } from "./useReplicateCollection"
import { useSubscribe } from "reactjrx"
import { useActiveProfile } from "../../profiles"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { useDatabase } from "../RxDbProvider"
import { useNetworkState } from "react-use"
import { useWatchAndFixConflicts } from "./conflicts/useWatchAndFixConflicts"
import { useConfig } from "../../config/useConfig"

type ReplicationState = ReturnType<ReturnType<typeof useReplicateCollection>>

export const useBackgroundReplication = () => {
  const { data: config } = useConfig()
  const { db: database } = useDatabase()
  const { online } = useNetworkState()
  const dbName = useActiveProfile().data?.dbName
  const isAuthenticated = useIsAuthenticated()
  const replicateBook = useReplicateCollection()
  const replicateTag = useReplicateCollection()
  const replicateCollection = useReplicateCollection()
  const replicateLink = useReplicateCollection()
  const replicateSettings = useReplicateCollection()
  const replicateDatasource = useReplicateCollection()
  const replicateSecret = useReplicateCollection()
  const [replicationStates, setReplicationStates] = useState<
    ReplicationState[]
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
        host: config?.API_COUCH_URI,
      }),
      replicateDatasource({
        collection: database.datasource,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_2,
      }),
      replicateTag({
        collection: database?.tag,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_2,
      }),
      replicateLink({
        collection: database.link,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_3,
      }),
      replicateSettings({
        collection: database.settings,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_3,
      }),
      replicateCollection({
        collection: database.obokucollection,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_4,
      }),
      replicateSecret({
        collection: database.secret,
        dbName,
        live: true,
        host: config?.API_COUCH_URI_4,
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
    config,
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
