import { useEffect, useMemo } from "react"
import { combineLatest, merge, NEVER, of, tap } from "rxjs"
import { useSignOut } from "../../auth/useSignOut"
import { syncSignal } from "./states"
import { triggerReplication$ } from "./triggerReplication"
import { useReplicateCollection } from "./useReplicateCollection"
import { useSignalValue, useSubscribe } from "reactjrx"
import { authStateSignal } from "../../auth/authState"
import { useDatabase } from "../RxDbProvider"
import { useNetworkState } from "react-use"
import { useWatchAndFixConflicts } from "./conflicts/useWatchAndFixConflicts"

export const useBackgroundReplication = () => {
  const signOut = useSignOut()
  const { db: database } = useDatabase()
  const { online } = useNetworkState()
  const { token, dbName } = useSignalValue(authStateSignal) ?? {}
  const { data: bookReplicationState, mutate: replicateBook } =
    useReplicateCollection()
  const { data: tagReplicationState, mutate: replicateTag } =
    useReplicateCollection()
  const { data: collectionReplicationState, mutate: replicateCollection } =
    useReplicateCollection()
  const { data: linkReplicationState, mutate: replicateLink } =
    useReplicateCollection()
  const { data: settingsReplicationState, mutate: replicateSettings } =
    useReplicateCollection()
  const { data: dataSourceReplicationState, mutate: replicateDatasource } =
    useReplicateCollection()

  const replicationStates = useMemo(
    () => [
      settingsReplicationState,
      dataSourceReplicationState,
      bookReplicationState,
      tagReplicationState,
      collectionReplicationState,
      linkReplicationState,
    ],
    [
      settingsReplicationState,
      dataSourceReplicationState,
      bookReplicationState,
      tagReplicationState,
      collectionReplicationState,
      linkReplicationState,
    ],
  )

  useWatchAndFixConflicts()

  useSubscribe(
    () =>
      triggerReplication$.pipe(
        tap(() => {
          replicationStates.forEach((state) => state?.reSync())
        }),
      ),
    [replicationStates],
  )

  useSubscribe(
    () =>
      combineLatest(
        replicationStates.map((replicationState) => {
          if (!replicationState) return NEVER

          return merge(
            replicationState.error$.pipe(
              tap((error) => {
                error.parameters.errors?.forEach((subError) => {
                  if (
                    subError.parameters?.args.jsonResponse?.error ===
                      "forbidden" ||
                    subError.parameters?.args.jsonResponse?.error ===
                      "unauthorized"
                  ) {
                    signOut()
                  }
                })
              }),
            ),
          )
        }),
      ),
    [replicationStates, signOut],
  )

  useSubscribe(
    () =>
      combineLatest(
        replicationStates.map((state) => state?.active$ ?? of(false)),
      ).pipe(
        tap((active) => {
          syncSignal.setValue((state) => ({
            ...state,
            active: active.reduce((acc, value) => (value ? acc + 1 : acc), 0),
          }))
        }),
      ),
    [replicationStates],
  )

  useEffect(
    () => () => {
      void online

      settingsReplicationState?.cancel()
    },
    [settingsReplicationState, online],
  )

  useEffect(
    () => () => {
      void online

      dataSourceReplicationState?.cancel()
    },
    [dataSourceReplicationState, online],
  )

  useEffect(
    () => () => {
      void online

      bookReplicationState?.cancel()
    },
    [bookReplicationState, online],
  )

  useEffect(
    () => () => {
      void online

      tagReplicationState?.cancel()
    },
    [tagReplicationState, online],
  )

  useEffect(
    () => () => {
      void online

      collectionReplicationState?.cancel()
    },
    [collectionReplicationState, online],
  )

  useEffect(() => {
    if (!token || !online) {
      linkReplicationState?.cancel()
    }
  }, [linkReplicationState, online, token])

  useEffect(() => {
    if (!database || !token || !dbName || !online) return

    replicateBook({ collection: database?.book, token, dbName, live: true })
    replicateDatasource({
      collection: database?.datasource,
      token,
      dbName,
      live: true,
    })
    replicateTag({ collection: database?.tag, token, dbName, live: true })
    replicateLink({ collection: database?.link, token, dbName, live: true })
    replicateSettings({
      collection: database?.settings,
      token,
      dbName,
      live: true,
    })
    replicateCollection({
      collection: database?.obokucollection,
      token,
      dbName,
      live: true,
    })
  }, [
    database,
    replicateBook,
    replicateDatasource,
    replicateTag,
    replicateLink,
    replicateSettings,
    replicateCollection,
    token,
    dbName,
    online,
  ])
}
