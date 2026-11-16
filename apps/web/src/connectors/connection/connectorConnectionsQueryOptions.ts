import { queryOptions } from "@tanstack/react-query"
import { connectorConnectionList } from "@oboku/shared"
import type { HttpApiClientWeb } from "../../http"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

export const createConnectorConnectionsQueryOptions = ({
  httpClientApi,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
}) =>
  queryOptions({
    queryKey: [API_QUERY_KEY_PREFIX, "connector-connections", profileId],
    queryFn: async function fetchConnectorConnections({ signal }) {
      const { data } = await connectorConnectionList({
        client: httpClientApi.sdkClient,
        signal,
      })

      return data
    },
    gcTime: 5 * 60 * 1000,
  })
