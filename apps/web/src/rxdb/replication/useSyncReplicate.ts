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
