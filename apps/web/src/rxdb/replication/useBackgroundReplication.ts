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
import { useConfig } from "../../config/useConfig"

type ReplicationState = ReturnType<ReturnType<typeof useReplicateCollection>>

export const useBackgroundReplication = () => {
  const { data: config } = useConfig()
  const { db: database } = useDatabase()
  const { online } = useNetworkState()
  const dbName = useActiveProfile().data?.dbName
  const isAuthenticated = useIsAuthenticated()
  const replicate = useReplicateCollection()
  const [replicationStates, setReplicationStates] = useState<
    ReplicationState[]
  >([])

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

    const collectionsToReplicate = [
      { collection: database.book, host: config?.API_COUCH_URI },
      { collection: database.datasource, host: config?.API_COUCH_URI_2 },
      { collection: database.tag, host: config?.API_COUCH_URI_2 },
      { collection: database.link, host: config?.API_COUCH_URI_3 },
      { collection: database.settings, host: config?.API_COUCH_URI_3 },
      { collection: database.obokucollection, host: config?.API_COUCH_URI_4 },
      { collection: database.secret, host: config?.API_COUCH_URI_4 },
    ]

    const states = collectionsToReplicate.map(({ collection, host }) =>
      replicate({ collection, dbName, live: true, host }),
    )

    setReplicationStates(states)

    return () => {
      states.forEach((state) => {
        state.remove()
      })
    }
  }, [database, replicate, dbName, config])

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
