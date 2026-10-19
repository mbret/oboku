import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import {
  type KoreaderSyncConnectionPushPositionData,
  type KoreaderSyncConnectionPushPositionResponse,
  koreaderSyncConnectionPushPosition,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"

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
  const httpClientApi = useHttpClientApi()

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
  })
}
