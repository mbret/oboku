import type { WebDAVDataSourceDocType } from "@oboku/shared"
import type { UseSynchronizeHook } from "../types"
import { from, map, switchMap } from "rxjs"
import { decryptSecret } from "../../secrets/secretsUtils"
import { getLatestDatabase } from "../../rxdb/RxDbProvider"
import { useRequestMasterKey } from "../../secrets/useRequestMasterKey"
import { useMutation$ } from "reactjrx"
import { throwIfNotDefined } from "../../common/rxjs/operators"

export const useSynchronize: UseSynchronizeHook<"webdav"> = () => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey()

  return useMutation$({
    mutationFn: (dataSource: WebDAVDataSourceDocType) => {
      const connectorId = dataSource.data_v2?.connectorId

      if (!connectorId) {
        throw new Error("No connector id")
      }

      return getLatestDatabase().pipe(
        switchMap((database) =>
          from(database.settings.getWebdavConnector(connectorId)).pipe(
            throwIfNotDefined,
            switchMap((connector) =>
              from(requestMasterKey()).pipe(
                switchMap((masterKey) =>
                  from(
                    database.secret
                      .findOne({
                        selector: { _id: connector.passwordAsSecretId },
                      })
                      .exec(),
                  ).pipe(
                    map((secret) => secret?.value),
                    throwIfNotDefined,
                    switchMap((secret) =>
                      from(decryptSecret(secret, masterKey)),
                    ),
                  ),
                ),
                map((password) => ({
                  data: {
                    password,
                    url: connector.url,
                    username: connector.username,
                  },
                })),
              ),
            ),
          ),
        ),
      )
    },
  })
}
