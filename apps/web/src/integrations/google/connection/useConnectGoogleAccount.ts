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
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { requestGoogleAuthorizationCode } from "../auth"
import { gsiSignal } from "../gsi"
import { googleConnectionQueryKey } from "./queryKeys"

/** Drive's picked files, and the email that tells the user which account is connected. */
const GOOGLE_CONNECTION_SCOPES = [GOOGLE_DRIVE_FILE_SCOPE, "openid", "email"]

const GSI_NOT_LOADED_MESSAGE =
  "Google's sign-in script has not loaded. Make sure nothing blocks accounts.google.com, then try again."

export const useConnectGoogleAccount = (
  options?: Pick<
    UseMutationOptions<GoogleConnectionConnectResponse, DefaultError, void>,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()
  const { data: config } = useConfig()

  return useMutation({
    ...options,
    mutationFn: async function connectGoogleAccount() {
      const { gsi } = gsiSignal.getValue()

      if (!gsi) throw new Error(GSI_NOT_LOADED_MESSAGE)

      const code = await requestGoogleAuthorizationCode({
        gsi,
        scopes: GOOGLE_CONNECTION_SCOPES,
        clientId: config?.GOOGLE_CLIENT_ID ?? "",
      })
      const { data } = await googleConnectionConnect({
        client: httpClientApi.sdkClient,
        body: { code },
      })

      return data
    },
    onSuccess: function rememberGoogleConnection(data) {
      queryClient.setQueryData(googleConnectionQueryKey(activeProfileId), data)
    },
  })
}
