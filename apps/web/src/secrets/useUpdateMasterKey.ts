import type { SettingsDocType } from "@oboku/shared"
import type { DefaultError, UseMutationOptions } from "@tanstack/react-query"
import type { RxDocument } from "rxdb"
import { useMutation$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { getSettingsDocument } from "../settings/dbHelpers"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { encryptMasterKey } from "./masterKeyUtils"
import { decryptMasterKey, generateMasterKey } from "./masterKeyUtils"

type UpdateMasterKeyVariables = { newPassword: string; oldPassword: string }

export const useUpdateMasterKey = (
  options?: Pick<
    UseMutationOptions<
      RxDocument<SettingsDocType>,
      DefaultError,
      UpdateMasterKeyVariables
    >,
    "meta"
  >,
) => {
  return useMutation$({
    ...options,
    mutationFn: ({ newPassword, oldPassword }: UpdateMasterKeyVariables) => {
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
