import { type OpdsServersRenameData, opdsServersRename } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { opdsServersQueryKey } from "./queryKeys"

export const useRenameOpdsServer = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: async function renameOpdsServer({
      id,
      name,
    }: OpdsServersRenameData["path"] & OpdsServersRenameData["body"]) {
      const { data } = await opdsServersRename({
        client: httpClientApi.sdkClient,
        path: { id },
        body: { name },
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
