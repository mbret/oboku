import { opdsServersCreate } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { opdsServersQueryKey } from "./queryKeys"

export const useCreateOpdsServer = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: async function createOpdsServer() {
      const { data } = await opdsServersCreate({
        client: httpClientApi.sdkClient,
      })

      return data
    },
    onSuccess: function refreshOpdsServers() {
      return queryClient.invalidateQueries({
        queryKey: opdsServersQueryKey(activeProfileId),
      })
    },
  })
}
