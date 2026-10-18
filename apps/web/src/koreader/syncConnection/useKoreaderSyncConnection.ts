import { useQuery } from "@tanstack/react-query"
import type { KoreaderSyncConnectionGetResponse } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const useKoreaderSyncConnection = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: koreaderSyncConnectionQueryKey(activeProfileId),
      queryFn: async function fetchKoreaderSyncConnection() {
        const { data } =
          await httpClientApi.fetchOrThrow<KoreaderSyncConnectionGetResponse>(
            `${config?.API_URL}/koreader-sync-connection`,
          )

        return data
      },
    }),
  )
}
