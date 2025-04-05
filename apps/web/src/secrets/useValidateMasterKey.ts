import { catchError, defaultIfEmpty, map } from "rxjs"
import { from } from "rxjs"
import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { mergeMap } from "rxjs"
import { getSettingsDocument } from "../settings/dbHelpers"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { decryptMasterKey } from "./masterKeyUtils"

export const validateMasterKey = (options: {
  onSuccess: () => void
  onError: () => void
}) => {
  return useMutation$({
    ...options,
    mutationFn: (input: string) => {
      if (!input) throw new Error("Invalid password")

      return getLatestDatabase().pipe(
        mergeMap((database) =>
          getSettingsDocument(database).pipe(
            map((settings) => settings?.masterEncryptionKey),
          ),
        ),
        throwIfNotDefined,
        mergeMap((masterEncryptionKey) =>
          from(decryptMasterKey(masterEncryptionKey, input)).pipe(
            catchError(() => {
              throw new Error("Invalid password")
            }),
            defaultIfEmpty(null),
          ),
        ),
      )
    },
  })
}
