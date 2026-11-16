import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type ConnectorConnectionDisconnectResponse,
  connectorConnectionDisconnect,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { cancelUnlessProfileIsActive } from "../../profiles/active/activeProfileId"
import { createConnectorConnectionsQueryOptions } from "./connectorConnectionsQueryOptions"

type DisconnectConnectorRequest = {
  /** The profile that disconnects, whose session the request must carry. */
  profileId: string | undefined
  connectorId: string
}

export const useDisconnectConnector = (
  options?: Pick<
    UseMutationOptions<
      ConnectorConnectionDisconnectResponse,
      DefaultError,
      DisconnectConnectorRequest
    >,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()

  return useMutation({
    ...options,
    mutationFn: async function disconnectConnector({
      profileId,
      connectorId,
    }: DisconnectConnectorRequest) {
      cancelUnlessProfileIsActive(profileId)

      const { data } = await connectorConnectionDisconnect({
        client: httpClientApi.sdkClient,
        path: { connectorId },
      })

      return data
    },
    onSuccess: function forgetConnectorConnection(_response, { profileId }) {
      return queryClient.invalidateQueries({
        queryKey: createConnectorConnectionsQueryOptions({
          httpClientApi,
          profileId,
        }).queryKey,
      })
    },
  })
}
