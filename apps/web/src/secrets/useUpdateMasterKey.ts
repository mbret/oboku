import { useMutation$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { getSettingsDocument } from "../settings/dbHelpers"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { encryptMasterKey } from "./masterKeyUtils"
import { decryptMasterKey, generateMasterKey } from "./masterKeyUtils"

export const useUpdateMasterKey = () => {
  return useMutation$({
    mutationFn: ({
      newPassword,
      oldPassword,
    }: {
      newPassword: string
      oldPassword: string
    }) => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          getSettingsDocument(db).pipe(
            throwIfNotDefined,
            switchMap((settingsDoc) => {
              const getOrGenerateMasterKey = () => {
                if (settingsDoc?.masterEncryptionKey) {
                  return from(
                    decryptMasterKey(
                      settingsDoc.masterEncryptionKey,
                      oldPassword,
                    ),
                  )
                }
                return from(generateMasterKey())
              }

              return getOrGenerateMasterKey().pipe(
                switchMap((masterKey) =>
                  from(encryptMasterKey(masterKey, newPassword)),
                ),
                switchMap((newlyEncryptedMasterKey) => {
                  return settingsDoc.incrementalPatch({
                    masterEncryptionKey: newlyEncryptedMasterKey,
                  })
                }),
              )
            }),
          ),
        ),
      )
    },
  })
}
