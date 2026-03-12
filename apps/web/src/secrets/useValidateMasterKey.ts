import { catchError, map } from "rxjs"
import { from, type Observable } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { mergeMap } from "rxjs"
import { getSettingsDocument } from "../settings/dbHelpers"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { decryptMasterKey } from "./masterKeyUtils"

/** Validates password and returns the decrypted master key. Used by the auth dialog and by validateMasterKey. */
export const validateMasterKeyFn = (password: string): Observable<string> => {
  if (!password) throw new Error("Invalid password")

  return getLatestDatabase().pipe(
    mergeMap((database) =>
      getSettingsDocument(database).pipe(
        map((settings) => settings?.masterEncryptionKey),
      ),
    ),
    throwIfNotDefined,
    mergeMap((masterEncryptionKey) =>
      from(decryptMasterKey(masterEncryptionKey, password)).pipe(
        catchError(() => {
          throw new Error("Invalid password")
        }),
      ),
    ),
  )
}
