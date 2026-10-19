import { useQuery } from "@tanstack/react-query"
import { koreaderSyncConnectionGet } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const useKoreaderSyncConnection = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: koreaderSyncConnectionQueryKey(activeProfileId),
      queryFn: async function fetchKoreaderSyncConnection() {
        const { data } = await koreaderSyncConnectionGet({
          client: httpClientApi.sdkClient,
        })

        return data
      },
    }),
  )
}
