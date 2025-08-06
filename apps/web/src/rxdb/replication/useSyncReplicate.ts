import { authStateSignal } from "../../auth/states.web"
import { from, mergeMap, of } from "rxjs"
import type { RxCollection } from "rxdb"
import { useReplicateCollection } from "./useReplicateCollection"
import { useMutation$ } from "reactjrx"

export const useSyncReplicate = () => {
  const replicateCollection = useReplicateCollection()

  return useMutation$({
    mutationFn: (collections: RxCollection[]) => {
      const { dbName } = authStateSignal.getValue() ?? {}

      if (!dbName) throw new Error("Invalid database")

      const replicationStates = of(
        collections.map((collection) =>
          replicateCollection({
            collection,
            live: false,
            dbName,
            autoStart: true,
            /**
             * @important
             * This is important to have a unique suffix to get a unique replication identifier and
             * prevent sync conflict with background ones.
             */
            suffix: `sync-one-shot-${self.crypto.randomUUID()}`,
          }),
        ),
      )

      return replicationStates.pipe(
        mergeMap((states) =>
          from(Promise.all(states.map((state) => state.awaitInSync()))),
        ),
      )
    },
  })
}
