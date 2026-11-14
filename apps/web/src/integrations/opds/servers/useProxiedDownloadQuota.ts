import { useQuery } from "@tanstack/react-query"
import { quotasGetProxiedDownloadQuota } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { API_QUERY_KEY_PREFIX } from "../../../queries/queryClient"

export const useProxiedDownloadQuota = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: [
        API_QUERY_KEY_PREFIX,
        "quotas",
        "proxied-downloads",
        activeProfileId,
      ],
      queryFn: async function fetchProxiedDownloadQuota() {
        const { data } = await quotasGetProxiedDownloadQuota({
          client: httpClientApi.sdkClient,
        })

        return data
      },
    }),
  )
}
