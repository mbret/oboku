import { from, map, switchMap } from "rxjs"
import { useMutation$ } from "reactjrx"
import { useRequestMasterKey } from "../secrets/useRequestMasterKey"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { decryptSecret } from "../secrets/secretsUtils"
import type {
  SettingsConnectorDocType,
  SettingsResolvedConnectorData,
} from "@oboku/shared"
import { isConnectorOfType } from "../rxdb/collections/settings"

export const useExtractConnectorData = <
  T extends SettingsConnectorDocType["type"],
>({
  type,
}: {
  type: T
}) => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey()

  return useMutation$({
    mutationFn: ({ connectorId }: { connectorId: string }) =>
      getLatestDatabase().pipe(
        switchMap((database) =>
          from(database.settings.getConnector(connectorId)).pipe(
            throwIfNotDefined,
            map((connector) => {
              if (!isConnectorOfType(connector, type)) {
                throw new Error(
                  `Connector ${connectorId} is not a ${type} connector`,
                )
              }

              return connector
            }),
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
                    map((password) => ({
                      data: {
                        ...connector,
                        password,
                      } satisfies SettingsResolvedConnectorData<T>,
                    })),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
  })
}
