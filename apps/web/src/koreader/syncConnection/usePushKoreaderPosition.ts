import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type KoreaderSyncConnectionGetResponse,
  type KoreaderSyncConnectionPushPositionData,
  type KoreaderSyncConnectionPushPositionResponse,
  koreaderSyncConnectionPushPosition,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { isKoreaderSyncConnectionUnusableError } from "./errors"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

export const usePushKoreaderPosition = (
  options?: Pick<
    UseMutationOptions<
      KoreaderSyncConnectionPushPositionResponse,
      DefaultError,
      KoreaderSyncConnectionPushPositionData["body"]
    >,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    ...options,
    networkMode: "online",
    mutationFn: async function pushKoreaderPosition(
      position: KoreaderSyncConnectionPushPositionData["body"],
    ) {
      const { data } = await koreaderSyncConnectionPushPosition({
        client: httpClientApi.sdkClient,
        body: position,
      })

      return data
    },
    onError: function forgetUnusableKoreaderSyncConnection(error) {
      if (!isKoreaderSyncConnectionUnusableError(error)) return

      queryClient.setQueryData<KoreaderSyncConnectionGetResponse>(
        koreaderSyncConnectionQueryKey(activeProfileId),
        { connection: null },
      )
    },
  })
}
