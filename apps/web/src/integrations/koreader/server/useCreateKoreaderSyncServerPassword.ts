import { koreaderSyncServerCreatePassword } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { koreaderSyncServerQueryKey } from "./queryKeys"

export const useCreateKoreaderSyncServerPassword = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: async function createKoreaderSyncServerPassword() {
      const { data } = await koreaderSyncServerCreatePassword({
        client: httpClientApi.sdkClient,
      })

      return data
    },
    onSuccess: function refreshKoreaderSyncServer() {
      return queryClient.invalidateQueries({
        queryKey: koreaderSyncServerQueryKey(activeProfileId),
      })
    },
  })
}
