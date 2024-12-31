import { replicateCouchDBCollection } from "./replicateCouchDBCollection"
import { RxCollection } from "rxdb"
import { Report } from "../../debug/report.shared"
import { distinctUntilChanged, skip } from "rxjs"
import { useMutation } from "@tanstack/react-query"

export const useReplicateCollection = <
  Collection extends RxCollection<RxDocumentType>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RxDocumentType = any
>() => {
  return useMutation({
    mutationFn: async ({
      collection,
      ...params
    }: { collection: Collection } & Parameters<
      typeof replicateCouchDBCollection
    >[0]) => {
      const state = replicateCouchDBCollection({
        ...params,
        collection
      })

      const id = Date.now()
      const replicationId = `${collection.name}:${id}`

      Report.info(`[replication]`, replicationId, `created`)

      // emits each document that was received from the remote
      state.received$.subscribe((doc) =>
        Report.info(`[replication]`, replicationId, `pull`, doc._id, doc)
      )

      // emits each document that was send to the remote
      state.sent$.subscribe((doc) =>
        Report.info(`[replication]`, replicationId, `push`, doc._id, doc)
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

        Report.info(`[replication]`, replicationId, `error`, error)
      })

      // emits true when the replication was canceled, false when not.
      state.canceled$
        .pipe(skip(1), distinctUntilChanged())
        .subscribe((bool) => {
          Report.info(`[replication]`, replicationId, `cancelled`, bool)

          if (state.isStopped()) {
            Report.info(`[replication]`, replicationId, `stopped`)
          }
        })

      // emits true when a replication cycle is running, false when not.
      state.active$.pipe(skip(1), distinctUntilChanged()).subscribe((bool) => {
        Report.info(`[replication]`, replicationId, `active`, bool)

        if (state.isStopped()) {
          Report.info(`[replication]`, replicationId, `stopped`)
        }
      })

      return state
    }
  })
}
