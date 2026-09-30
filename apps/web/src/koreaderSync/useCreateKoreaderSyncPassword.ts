import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../http"
import { useActiveProfileId } from "../profiles/active/activeProfileId"
import { koreaderSyncQueryKey } from "./queryKeys"

export const useCreateKoreaderSyncPassword = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: async function createKoreaderSyncPassword() {
      const { data } = await httpClientApi.createKoreaderSyncPassword()

      return data
    },
    onSuccess: function refreshKoreaderSync() {
      return queryClient.invalidateQueries({
        queryKey: koreaderSyncQueryKey(activeProfileId),
      })
    },
  })
}
