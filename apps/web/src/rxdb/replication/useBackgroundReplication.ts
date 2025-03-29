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
import type { RxCouchDBReplicationState } from "rxdb/dist/types/plugins/replication-couchdb"
import { configuration } from "../../config/configuration"

export const useBackgroundReplication = () => {
  const signOut = useSignOut()
  const { db: database } = useDatabase()
  const { online } = useNetworkState()
  const { token, dbName } = useSignalValue(authStateSignal) ?? {}
  const { data: bookReplicationState, mutateAsync: replicateBook } =
    useReplicateCollection()
  const { data: tagReplicationState, mutateAsync: replicateTag } =
    useReplicateCollection()
  const { data: collectionReplicationState, mutateAsync: replicateCollection } =
    useReplicateCollection()
  const { data: linkReplicationState, mutateAsync: replicateLink } =
    useReplicateCollection()
  const { data: settingsReplicationState, mutateAsync: replicateSettings } =
    useReplicateCollection()
  const { data: dataSourceReplicationState, mutateAsync: replicateDatasource } =
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
                    // invalid / outdated / wrong token
                    subError.parameters?.args.jsonResponse?.error ===
                      "forbidden" ||
                    subError.parameters?.args.jsonResponse?.error ===
                      "unauthorized" ||
                    // malformed token
                    (subError.parameters?.args.jsonResponse?.error ===
                      "bad_request" &&
                      subError.parameters.args.jsonResponse?.reason ===
                        "Malformed token")
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

  useEffect(() => {
    let unmounted = false
    if (!database || !token || !dbName || !online) return

    let states: RxCouchDBReplicationState<unknown>[] = []
    ;(async () => {
      states = await Promise.all([
        replicateBook({
          collection: database.book,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI,
        }),
        replicateDatasource({
          collection: database.datasource,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI,
        }),
        replicateTag({
          collection: database?.tag,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI_2,
        }),
        replicateLink({
          collection: database.link,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI_2,
        }),
        replicateSettings({
          collection: database.settings,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI_3,
        }),
        replicateCollection({
          collection: database.obokucollection,
          token,
          dbName,
          live: true,
          host: configuration.API_COUCH_URI_3,
        }),
      ])

      if (unmounted) {
        states.forEach((state) => state?.cancel())
      }
    })()

    return () => {
      unmounted = true

      states.forEach((state) => state?.cancel())
    }
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
