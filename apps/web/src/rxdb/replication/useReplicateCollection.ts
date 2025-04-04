import { replicateCouchDBCollection } from "./replicateCouchDBCollection"
import type { RxCollection } from "rxdb"
import { Logger } from "../../debug/logger.shared"
import { distinctUntilChanged, skip } from "rxjs"
import { useCallback } from "react"

export const useReplicateCollection = <
  Collection extends RxCollection<RxDocumentType>,
  RxDocumentType = any,
>() => {
  return useCallback(
    ({
      collection,
      ...params
    }: { collection: Collection } & Omit<
      Parameters<typeof replicateCouchDBCollection>[0],
      "cancelSignal"
    >) => {
      const cancelSignal = new AbortController()

      const state = replicateCouchDBCollection({
        ...params,
        collection,
        cancelSignal: cancelSignal.signal,
      })

      const id = Date.now()
      const replicationId = `${collection.name}:${id}`

      Logger.info(`[replication]`, replicationId, `created`)

      // emits each document that was received from the remote
      state.received$.subscribe((doc) =>
        Logger.info(`[replication]`, replicationId, `pull`, doc._id, doc),
      )

      // emits each document that was send to the remote
      state.sent$.subscribe((doc) =>
        Logger.info(`[replication]`, replicationId, `push`, doc._id, doc),
      )

      // emits all errors that happen when running the push- & pull-handlers.
      state.error$.subscribe((error) => {
        // firefox seems to log as error for longpoll that does not return valid value
        if (
          error.rxdb &&
          error.parameters.error?.message ===
            `Content-Length header of network response exceeds response Body.`
        ) {
          return
        }

        Logger.info(`[replication]`, replicationId, `error`, error)
      })

      // emits true when the replication was canceled, false when not.
      state.canceled$
        .pipe(skip(1), distinctUntilChanged())
        .subscribe((bool) => {
          cancelSignal.abort()

          Logger.info(`[replication]`, replicationId, `cancelled`, bool)

          if (state.isStopped()) {
            Logger.info(`[replication]`, replicationId, `stopped`)
          }
        })

      // emits true when a replication cycle is running, false when not.
      state.active$.pipe(skip(1), distinctUntilChanged()).subscribe((bool) => {
        Logger.info(`[replication]`, replicationId, `active`, bool)

        if (state.isStopped()) {
          Logger.info(`[replication]`, replicationId, `stopped`)
        }
      })

      return state
    },
    [],
  )
}
