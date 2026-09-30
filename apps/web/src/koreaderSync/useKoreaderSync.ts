import { useQuery } from "@tanstack/react-query"
import type { GetKoreaderSyncResponse } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../auth"
import { useConfig } from "../config/useConfig"
import { useHttpClientApi } from "../http"
import { useActiveProfileId } from "../profiles/active/activeProfileId"
import { koreaderSyncQueryKey } from "./queryKeys"

export const useKoreaderSync = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: koreaderSyncQueryKey(activeProfileId),
      queryFn: async function fetchKoreaderSync() {
        const { data } =
          await httpClientApi.fetchOrThrow<GetKoreaderSyncResponse>(
            `${config?.API_URL}/koreader-sync`,
          )

        return data
      },
    }),
  )
}
