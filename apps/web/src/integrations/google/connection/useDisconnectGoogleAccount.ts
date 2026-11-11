import { googleConnectionDisconnect } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { googleConnectionQueryKey } from "./queryKeys"

export const useDisconnectGoogleAccount = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: function disconnectGoogleAccount() {
      return googleConnectionDisconnect({
        client: httpClientApi.sdkClient,
      })
    },
    onSuccess: function refreshGoogleConnection() {
      return queryClient.invalidateQueries({
        queryKey: googleConnectionQueryKey(activeProfileId),
      })
    },
  })
}
