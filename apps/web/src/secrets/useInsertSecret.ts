import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { generateId } from "../rxdb/collections/utils"
import type { SecretDocType } from "@oboku/shared"

export const useInsertSecret = () => {
  return useMutation$({
    mutationFn: (data: Pick<SecretDocType, "name" | "value">) =>
      getLatestDatabase().pipe(
        switchMap((db) =>
          from(
            db.secret.insert({
              _id: generateId(),
              rx_model: "secret",
              modifiedAt: null,
              createdAt: new Date().toISOString(),
              ...data,
            }),
          ),
        ),
      ),
  })
}
