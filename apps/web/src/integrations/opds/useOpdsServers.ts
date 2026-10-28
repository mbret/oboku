import { useQuery } from "@tanstack/react-query"
import { opdsServersList } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { opdsServersQueryKey } from "./queryKeys"

export const useOpdsServers = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: opdsServersQueryKey(activeProfileId),
      queryFn: async function fetchOpdsServers() {
        const { data } = await opdsServersList({
          client: httpClientApi.sdkClient,
        })

        return data
      },
    }),
  )
}
