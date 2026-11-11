import { googleConnectionDisconnect } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../../http"
import { cancelUnlessProfileIsActive } from "../../../profiles/active/activeProfileId"
import { createGoogleConnectionQueryOptions } from "./useGoogleConnection"

export const useDisconnectGoogleAccount = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()

  return useMutation({
    mutationFn: function disconnectGoogleAccount({
      profileId,
    }: {
      /** The profile that disconnects, whose session the request must carry. */
      profileId: string | undefined
    }) {
      cancelUnlessProfileIsActive(profileId)

      return googleConnectionDisconnect({
        client: httpClientApi.sdkClient,
      })
    },
    onSuccess: function refreshGoogleConnection(_response, { profileId }) {
      return queryClient.invalidateQueries({
        queryKey: createGoogleConnectionQueryOptions({
          httpClientApi,
          profileId,
        }).queryKey,
      })
    },
  })
}
