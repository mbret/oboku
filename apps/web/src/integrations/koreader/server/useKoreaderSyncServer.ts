import { useQuery } from "@tanstack/react-query"
import { koreaderSyncServerGet } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { koreaderSyncServerQueryKey } from "./queryKeys"

export const useKoreaderSyncServer = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: koreaderSyncServerQueryKey(activeProfileId),
      queryFn: async function fetchKoreaderSyncServer() {
        const { data } = await koreaderSyncServerGet({
          client: httpClientApi.sdkClient,
        })

        return data
      },
    }),
  )
}
