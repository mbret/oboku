import { queryOptions, useQuery } from "@tanstack/react-query"
import { koreaderSyncConnectionGet } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const createKoreaderSyncConnectionQueryOptions = ({
  httpClientApi,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
}) =>
  queryOptions({
    queryKey: koreaderSyncConnectionQueryKey(profileId),
    queryFn: async function fetchKoreaderSyncConnection({ signal }) {
      const { data } = await koreaderSyncConnectionGet({
        client: httpClientApi.sdkClient,
        signal,
      })

      return data
    },
    gcTime: 5 * 60 * 1000,
  })

export type KoreaderSyncConnectionQueryOptions = ReturnType<
  typeof createKoreaderSyncConnectionQueryOptions
>

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
