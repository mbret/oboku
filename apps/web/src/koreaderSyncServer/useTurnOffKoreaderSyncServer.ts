import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../http"
import { useActiveProfileId } from "../profiles/active/activeProfileId"
import { koreaderSyncServerQueryKey } from "./queryKeys"

export const useTurnOffKoreaderSyncServer = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: httpClientApi.turnOffKoreaderSyncServer,
    onSuccess: function refreshKoreaderSyncServer() {
      return queryClient.invalidateQueries({
        queryKey: koreaderSyncServerQueryKey(activeProfileId),
      })
    },
  })
}
