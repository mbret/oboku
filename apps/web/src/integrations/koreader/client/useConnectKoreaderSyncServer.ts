import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type KoreaderSyncConnectionConnectData,
  type KoreaderSyncConnectionConnectResponse,
  koreaderSyncConnectionConnect,
} from "@oboku/shared"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const useConnectKoreaderSyncServer = (
  options?: Pick<
    UseMutationOptions<
      KoreaderSyncConnectionConnectResponse,
      DefaultError,
      KoreaderSyncConnectionConnectData["body"]
    >,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    ...options,
    mutationFn: async function connectKoreaderSyncServer(
      request: KoreaderSyncConnectionConnectData["body"],
    ) {
      const { data } = await koreaderSyncConnectionConnect({
        client: httpClientApi.sdkClient,
        body: request,
      })

      return data
    },
    onSuccess: function rememberKoreaderSyncConnection(data) {
      queryClient.setQueryData(
        koreaderSyncConnectionQueryKey(activeProfileId),
        data,
      )
    },
  })
}
