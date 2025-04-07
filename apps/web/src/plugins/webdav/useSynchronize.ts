import type { WebDAVDataSourceDocType } from "@oboku/shared"
import type { UseSynchronizeHook } from "../types"
import { firstValueFrom } from "rxjs"
import { decryptSecret } from "../../secrets/secretsUtils"
import { getLatestDatabase } from "../../rxdb/RxDbProvider"
import { useRequestMasterKey } from "../../secrets/useRequestMasterKey"

export const useSynchronize: UseSynchronizeHook<"webdav"> = () => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey()

  return async (dataSource: WebDAVDataSourceDocType) => {
    const passwordAsSecretId = dataSource.data_v2?.passwordAsSecretId

    if (!passwordAsSecretId) {
      throw new Error("No password as secret id")
    }

    const masterKey = await requestMasterKey()
    const database = await firstValueFrom(getLatestDatabase())
    const secret = await database.secret
      .findOne({ selector: { _id: passwordAsSecretId } })
      .exec()

    if (!secret || !secret.value) {
      throw new Error("No secret found")
    }

    const decryptedSecret = await decryptSecret(secret.value, masterKey)

    return { data: { password: decryptedSecret } }
  }
}
