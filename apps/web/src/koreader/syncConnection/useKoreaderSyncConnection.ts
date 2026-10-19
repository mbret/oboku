import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { koreaderSyncConnectionGet } from "@oboku/shared"
import { useCallback } from "react"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

const createKoreaderSyncConnectionQueryOptions = ({
  httpClientApi,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
}) =>
  queryOptions({
    queryKey: koreaderSyncConnectionQueryKey(profileId),
    queryFn: async function fetchKoreaderSyncConnection() {
      const { data } = await koreaderSyncConnectionGet({
        client: httpClientApi.sdkClient,
      })

      return data
    },
  })

export const useKoreaderSyncConnection = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication(
      createKoreaderSyncConnectionQueryOptions({
        httpClientApi,
        profileId: activeProfileId,
      }),
    ),
  )
}

/**
 * The connection for code that runs outside rendering, such as a push. The
 * calling component keeps the query in use, so react-query refreshes it as it
 * does any query in use: when the component mounts, when the network comes
 * back. The returned function resolves the latest answer, waits for it when
 * none has arrived yet, and keeps working once the component has unmounted.
 */
export const useEnsureKoreaderSyncConnection = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  useKoreaderSyncConnection()

  return useCallback(
    function ensureKoreaderSyncConnection() {
      return queryClient.ensureQueryData(
        createKoreaderSyncConnectionQueryOptions({
          httpClientApi,
          profileId: activeProfileId,
        }),
      )
    },
    [queryClient, httpClientApi, activeProfileId],
  )
}
