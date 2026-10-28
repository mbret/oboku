import { type OpdsServersDeleteData, opdsServersDelete } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { opdsServersQueryKey } from "./queryKeys"

export const useDeleteOpdsServer = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: function deleteOpdsServer(
      id: OpdsServersDeleteData["path"]["id"],
    ) {
      return opdsServersDelete({
        client: httpClientApi.sdkClient,
        path: { id },
      })
    },
    onSuccess: function refreshOpdsServers() {
      return queryClient.invalidateQueries({
        queryKey: opdsServersQueryKey(activeProfileId),
      })
    },
  })
}
