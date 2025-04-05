import { useMutation$ } from "reactjrx"
import { from, of, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { getSettingsDocument } from "../settings/dbHelpers"
import { throwIfNotDefined } from "../common/rxjs/operators"

export const useRemoveMasterKey = () => {
  return useMutation$({
    mutationFn: () => {
      const confirmed = confirm(
        "(Currently no safeguard implemented) This action is irreversible, you will lose access to all your secrets. Once the master password is removed, you can set a new one.",
      )

      if (!confirmed) {
        return of(null)
      }

      return latestDatabase$.pipe(
        switchMap((db) => {
          return getSettingsDocument(db).pipe(
            throwIfNotDefined,
            switchMap((settings) => {
              return from(
                settings.incrementalPatch({
                  masterEncryptionKey: null,
                }),
              )
            }),
          )
        }),
      )
    },
  })
}
