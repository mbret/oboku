import { useQuery } from "@tanstack/react-query"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { createConnectorConnectionsQueryOptions } from "./connectorConnectionsQueryOptions"

/** The connector's connection, or `null` while it is not connected. */
export const useConnectorConnection = ({
  connectorId,
}: {
  connectorId: string
}) => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      ...createConnectorConnectionsQueryOptions({
        httpClientApi,
        profileId: activeProfileId,
      }),
      select: function selectConnectorConnection({ connections }) {
        return (
          connections.find(
            (connection) => connection.connectorId === connectorId,
          ) ?? null
        )
      },
    }),
  )
}
