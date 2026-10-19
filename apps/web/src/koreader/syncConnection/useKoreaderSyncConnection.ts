import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { koreaderSyncConnectionGet } from "@oboku/shared"
import { useCallback } from "react"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

/**
 * Pushes take the connection from the cache, and nothing shows it while a
 * book is open: with the app's `gcTime` of 0, the answer would be dropped as
 * soon as it arrives and every push would ask the API again.
 */
const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

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
    gcTime: KOREADER_SYNC_CONNECTION_GC_TIME_MS,
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
 * The connection for code that runs outside rendering, such as a push: the
 * cached answer when there is one, otherwise the API's. The returned function
 * keeps working once the component that got it has unmounted.
 */
export const useEnsureKoreaderSyncConnection = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

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
