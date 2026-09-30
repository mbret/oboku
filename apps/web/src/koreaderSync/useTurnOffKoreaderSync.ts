import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../http"
import { useActiveProfileId } from "../profiles/active/activeProfileId"
import { koreaderSyncQueryKey } from "./queryKeys"

export const useTurnOffKoreaderSync = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: httpClientApi.turnOffKoreaderSync,
    onSuccess: function refreshKoreaderSync() {
      return queryClient.invalidateQueries({
        queryKey: koreaderSyncQueryKey(activeProfileId),
      })
    },
  })
}
