import { useQuery } from "@tanstack/react-query"
import { quotasGetProxiedDownloads } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { proxiedDownloadQuotaQueryKey } from "./queryKeys"

export const useProxiedDownloadQuota = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: proxiedDownloadQuotaQueryKey(activeProfileId),
      queryFn: async function fetchProxiedDownloadQuota() {
        const { data } = await quotasGetProxiedDownloads({
          client: httpClientApi.sdkClient,
        })

        return data
      },
    }),
  )
}
