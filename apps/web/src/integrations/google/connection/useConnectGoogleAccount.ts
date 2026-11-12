import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  GOOGLE_DRIVE_FILE_SCOPE,
  type GoogleConnectionConnectResponse,
  googleConnectionConnect,
} from "@oboku/shared"
import { useConfig } from "../../../config/useConfig"
import { useHttpClientApi } from "../../../http"
import { cancelUnlessProfileIsActive } from "../../../profiles/active/activeProfileId"
import { requestGoogleAuthorizationCode } from "../auth"
import { getGsiOrThrow } from "../gsi"
import { createGoogleConnectionQueryOptions } from "./useGoogleConnection"

/** Drive's picked files, and the email that tells the user which account is connected. */
const GOOGLE_CONNECTION_SCOPES = [GOOGLE_DRIVE_FILE_SCOPE, "openid", "email"]

type ConnectGoogleAccountRequest = {
  /** The profile that connects, whose session the request must carry. */
  profileId: string | undefined
}

export const useConnectGoogleAccount = (
  options?: Pick<
    UseMutationOptions<
      GoogleConnectionConnectResponse,
      DefaultError,
      ConnectGoogleAccountRequest
    >,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()

  return useMutation({
    ...options,
    mutationFn: async function connectGoogleAccount({
      profileId,
    }: ConnectGoogleAccountRequest) {
      const code = await requestGoogleAuthorizationCode({
        gsi: getGsiOrThrow(),
        scopes: GOOGLE_CONNECTION_SCOPES,
        clientId: config?.GOOGLE_CLIENT_ID ?? "",
      })

      cancelUnlessProfileIsActive(profileId)

      const { data } = await googleConnectionConnect({
        client: httpClientApi.sdkClient,
        body: { code },
      })

      return data
    },
    onSuccess: function rememberGoogleConnection(data, { profileId }) {
      queryClient.setQueryData(
        createGoogleConnectionQueryOptions({ httpClientApi, profileId })
          .queryKey,
        data,
      )
    },
  })
}
