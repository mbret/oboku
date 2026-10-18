import { useQuery } from "@tanstack/react-query"
import type { KoreaderSyncServerGetResponse } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncServerQueryKey } from "./queryKeys"

export const useKoreaderSyncServer = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: koreaderSyncServerQueryKey(activeProfileId),
      queryFn: async function fetchKoreaderSyncServer() {
        const { data } =
          await httpClientApi.fetchOrThrow<KoreaderSyncServerGetResponse>(
            `${config?.API_URL}/koreader-sync-server`,
          )

        return data
      },
    }),
  )
}
