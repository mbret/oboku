import { googleConnectionDisconnect } from "@oboku/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../../../http"
import { cancelUnlessProfileIsActive } from "../../../profiles/active/activeProfileId"
import { clearGoogleAccessToken } from "../auth"
import { createGoogleConnectionQueryOptions } from "./googleConnectionQueryOptions"

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
    onSuccess: function forgetGoogleConnection(_response, { profileId }) {
      // The token in use may be minted from the connection: dropping it makes
      // the next Drive request open Google's sign-in, where the user picks an
      // account.
      clearGoogleAccessToken()

      return queryClient.invalidateQueries({
        queryKey: createGoogleConnectionQueryOptions({
          httpClientApi,
          profileId,
        }).queryKey,
      })
    },
  })
}
