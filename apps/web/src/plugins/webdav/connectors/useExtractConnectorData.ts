import { from, map, switchMap } from "rxjs"
import { useMutation$ } from "reactjrx"
import { useRequestMasterKey } from "../../../secrets/useRequestMasterKey"
import { getLatestDatabase } from "../../../rxdb/RxDbProvider"
import { throwIfNotDefined } from "../../../common/rxjs/operators"
import { decryptSecret } from "../../../secrets/secretsUtils"

export const useExtractConnectorData = () => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey()

  return useMutation$({
    mutationFn: ({ connectorId }: { connectorId: string }) =>
      getLatestDatabase().pipe(
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
      ),
  })
}
