import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { switchMap } from "rxjs"

export const useRemoveSecret = (options: { onSuccess?: () => void }) => {
  return useMutation$({
    ...options,
    mutationFn: (id: string) =>
      getLatestDatabase().pipe(
        switchMap((db) => db.secret.incrementalRemoveDocument(id)),
      ),
  })
}
