import { authStateSignal } from "../../auth/authState"
import { from, mergeMap } from "rxjs"
import { useMutation } from "reactjrx"
import { RxCollection } from "rxdb"
import { useReplicateCollection } from "./useReplicateCollection"

export const useSyncReplicate = () => {
  const { mutateAsync } = useReplicateCollection()
  return useMutation({
    mutationFn: (collections: RxCollection[]) => {
      const { token, dbName } = authStateSignal.getValue() ?? {}

      if (!dbName || !token) throw new Error("Invalid database")

      const replicationStates = from(
        Promise.all(
          collections.map((collection) =>
            mutateAsync({
              collection,
              live: false,
              dbName,
              token
            })
          )
        )
      )

      return replicationStates.pipe(
        mergeMap((states) =>
          from(Promise.all(states.map((state) => state.awaitInSync())))
        )
      )
    }
  })
}
