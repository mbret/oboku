import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type ConnectableConnectorType,
  type ConnectorConnectionConnectResponse,
  connectorConnectionConnect,
  ObokuErrorCode,
  ObokuSharedError,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { cancelUnlessProfileIsActive } from "../../profiles/active/activeProfileId"
import { awaitDocumentsPushed } from "../../rxdb/replication/awaitDocumentsPushed"
import { useExtractConnectorData } from "../useExtractConnectorData"
import { createConnectorConnectionsQueryOptions } from "./connectorConnectionsQueryOptions"

type ConnectConnectorRequest = {
  /** The profile that connects, whose session the request must carry. */
  profileId: string | undefined
  connectorId: string
}

/**
 * Asks for the master password, decrypts the connector's password, waits
 * until the connector and its password secret have reached oboku's server,
 * and sends the password to the server, which keeps it.
 */
export const useConnectConnector = (
  { type }: { type: ConnectableConnectorType },
  options?: Pick<
    UseMutationOptions<
      ConnectorConnectionConnectResponse,
      DefaultError,
      ConnectConnectorRequest
    >,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: extractConnectorData } = useExtractConnectorData(
    { type },
    { meta: { suppressGlobalErrorToast: true } },
  )

  return useMutation({
    ...options,
    mutationFn: async function connectConnector({
      profileId,
      connectorId,
    }: ConnectConnectorRequest) {
      cancelUnlessProfileIsActive(profileId)

      const {
        data: { password },
        documents,
      } = await extractConnectorData({ connectorId })

      cancelUnlessProfileIsActive(profileId)

      await awaitDocumentsPushed(documents).catch(function failAsNotOnServer(
        error: unknown,
      ) {
        throw new ObokuSharedError(
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND,
          error,
        )
      })

      cancelUnlessProfileIsActive(profileId)

      const { data } = await connectorConnectionConnect({
        client: httpClientApi.sdkClient,
        path: { connectorId },
        body: { password },
      })

      return data
    },
    onSuccess: function refreshConnectorConnections(_response, { profileId }) {
      return queryClient.invalidateQueries({
        queryKey: createConnectorConnectionsQueryOptions({
          httpClientApi,
          profileId,
        }).queryKey,
      })
    },
  })
}
