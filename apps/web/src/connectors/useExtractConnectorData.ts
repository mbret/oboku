import type { DefaultError } from "@tanstack/react-query"
import { from, map, of, switchMap } from "rxjs"
import { useMutation$, type UseMutation$Options } from "reactjrx"
import { useRequestMasterKey } from "../secrets/useRequestMasterKey"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { decryptSecret } from "../secrets/secretsUtils"
import type {
  SettingsConnectorDocType,
  SettingsResolvedConnectorData,
} from "@oboku/shared"
import { isConnectorOfType } from "../rxdb/collections/settings"
import type { PushableDocument } from "../rxdb/replication/awaitDocumentsPushed"

type ExtractedConnectorData<T extends SettingsConnectorDocType["type"]> = {
  data: SettingsResolvedConnectorData<T>
  /** The settings and secret documents `data` was read from. */
  documents: ReadonlyArray<PushableDocument>
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
          from(database.settings.findOne("settings").exec()).pipe(
            throwIfNotDefined,
            map((settings) => {
              const connector = settings.connectors?.find(
                ({ id }) => id === connectorId,
              )

              if (!connector) {
                throw new Error(`Connector ${connectorId} not found`)
              }

              if (!isConnectorOfType(connector, type)) {
                throw new Error(
                  `Connector ${connectorId} is not a ${type} connector`,
                )
              }

              return { settings, connector }
            }),
            switchMap(({ settings, connector }) =>
              from(requestMasterKey()).pipe(
                switchMap((masterKey) =>
                  from(
                    database.secret
                      .findOne({
                        selector: { _id: connector.passwordAsSecretId },
                      })
                      .exec(),
                  ).pipe(
                    throwIfNotDefined,
                    switchMap((secret) =>
                      of(secret.value).pipe(
                        throwIfNotDefined,
                        switchMap((secretValue) =>
                          from(decryptSecret(secretValue, masterKey)),
                        ),
                        map((password) => ({
                          data: {
                            ...connector,
                            password,
                          } satisfies SettingsResolvedConnectorData<T>,
                          documents: [settings, secret],
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
