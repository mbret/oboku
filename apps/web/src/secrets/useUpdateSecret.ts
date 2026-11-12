import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { switchMap } from "rxjs"
import type { SecretDocType } from "@oboku/shared"

export const useUpdateSecret = () => {
  return useMutation$({
    mutationFn: (
      data: Partial<Pick<SecretDocType, "name" | "value">> & { _id: string },
    ) =>
      getLatestDatabase().pipe(
        switchMap((db) => db.secret.incrementalPatchDocument(data._id, data)),
      ),
  })
}
