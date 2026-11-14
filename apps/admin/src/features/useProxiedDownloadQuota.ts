import { useQuery } from "@tanstack/react-query"
import { adminGetProxiedDownloadQuota } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useProxiedDownloadQuota = () => {
  return useQuery({
    queryKey: ["admin", "quotas", "proxied-downloads"],
    queryFn: async function fetchProxiedDownloadQuota() {
      const { data } = await adminGetProxiedDownloadQuota({ client: apiClient })

      return data
    },
  })
}
