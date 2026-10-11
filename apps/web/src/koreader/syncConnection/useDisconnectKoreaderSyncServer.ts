import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const useDisconnectKoreaderSyncServer = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: httpClientApi.disconnectKoreaderSyncServer,
    onSuccess: function refreshKoreaderSyncConnection() {
      return queryClient.invalidateQueries({
        queryKey: koreaderSyncConnectionQueryKey(activeProfileId),
      })
    },
  })
}
