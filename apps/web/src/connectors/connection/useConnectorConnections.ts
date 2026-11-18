import { useQuery } from "@tanstack/react-query"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { createConnectorConnectionsQueryOptions } from "./connectorConnectionsQueryOptions"

export const useConnectorConnections = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication(
      createConnectorConnectionsQueryOptions({
        httpClientApi,
        profileId: activeProfileId,
      }),
    ),
  )
}
