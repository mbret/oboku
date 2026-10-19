import { queryOptions, useQuery } from "@tanstack/react-query"
import { koreaderSyncConnectionGet } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

/**
 * Keeps the answer once nothing shows it, where the app's default `gcTime` is
 * 0: the screens showing the connection open with it, and pushes read it
 * without asking the API each time.
 */
const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

export const createKoreaderSyncConnectionQueryOptions = ({
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
