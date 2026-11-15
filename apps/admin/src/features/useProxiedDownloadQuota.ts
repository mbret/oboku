import { useQuery } from "@tanstack/react-query"
import { adminGetProxiedDownloadQuota } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const proxiedDownloadQuotaQueryKey = [
  "admin",
  "quotas",
  "proxied-downloads",
] as const

export const useProxiedDownloadQuota = () => {
  return useQuery({
    queryKey: proxiedDownloadQuotaQueryKey,
    queryFn: async function fetchProxiedDownloadQuota() {
      const { data } = await adminGetProxiedDownloadQuota({ client: apiClient })

      return data
    },
  })
}
