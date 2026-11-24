import type { DefaultError } from "@tanstack/react-query"
import { from, map, switchMap } from "rxjs"
import { useMutation$, type UseMutation$Options } from "reactjrx"
import { useRequestMasterKey } from "../secrets/useRequestMasterKey"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { decryptSecret } from "../secrets/secretsUtils"
import type {
  SecretDocType,
  SettingsConnectorDocType,
  SettingsResolvedConnectorData,
} from "@oboku/shared"
import { isConnectorOfType } from "../rxdb/collections/settings"

type ExtractedConnectorData<T extends SettingsConnectorDocType["type"]> = {
  data: SettingsResolvedConnectorData<T>
  /** What `data.password` was decrypted from, as the database holds it. */
  decryptedFrom: {
    connector: Extract<SettingsConnectorDocType, { type: T }>
    passwordSecretValue: NonNullable<SecretDocType["value"]>
  }
}

export const useExtractConnectorData = <
  T extends SettingsConnectorDocType["type"],
>(
  { type }: { type: T },
  options?: Omit<
    UseMutation$Options<
      ExtractedConnectorData<T>,
      DefaultError,
      { connectorId: string }
    >,
    "mutationFn"
  >,
) => {
  const { mutateAsync: requestMasterKey } = useRequestMasterKey({
    meta: options?.meta,
  })

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
                    switchMap((passwordSecretValue) =>
                      from(decryptSecret(passwordSecretValue, masterKey)).pipe(
                        map((password) => ({
                          data: {
                            ...connector,
                            password,
                          } satisfies SettingsResolvedConnectorData<T>,
                          decryptedFrom: { connector, passwordSecretValue },
                        })),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ...options,
  })
}
