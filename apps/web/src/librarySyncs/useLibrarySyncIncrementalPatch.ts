import type { LibrarySyncDocType } from "@oboku/shared"
import { switchMap, from } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"

export const useLibrarySyncIncrementalPatch = () => {
  return useMutation$({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<LibrarySyncDocType>
    }) =>
      getLatestDatabase().pipe(
        switchMap((db) =>
          from(db.datasource.findOne(id).incrementalPatch(patch)),
        ),
      ),
  })
}
