import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import type {
  ConnectKoreaderSyncServerRequest,
  GetKoreaderSyncConnectionResponse,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const useConnectKoreaderSyncServer = (
  options?: Pick<
    UseMutationOptions<
      GetKoreaderSyncConnectionResponse,
      DefaultError,
      ConnectKoreaderSyncServerRequest
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
      request: ConnectKoreaderSyncServerRequest,
    ) {
      const { data } = await httpClientApi.connectKoreaderSyncServer(request)

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
