import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type KoreaderSyncConnectionGetResponse,
  type KoreaderSyncConnectionPushPositionData,
  koreaderSyncConnectionPushPosition,
} from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { isKoreaderSyncConnectionUnusableError } from "./errors"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

/**
 * Pushes a position to the account's KOReader sync server, and does nothing
 * when the account has none. A push refused because the account has no
 * connection, or because the server no longer accepts its key, records that
 * there is none, so the pushes after it are skipped.
 */
export const usePushKoreaderPosition = (
  options?: Pick<
    UseMutationOptions<
      void,
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
    mutationFn: async function pushKoreaderPositionWhenConnected(
      position: KoreaderSyncConnectionPushPositionData["body"],
    ) {
      const { connection } = await queryClient.ensureQueryData(
        createKoreaderSyncConnectionQueryOptions({
          httpClientApi,
          profileId: activeProfileId,
        }),
      )

      if (!connection) return

      await koreaderSyncConnectionPushPosition({
        client: httpClientApi.sdkClient,
        body: position,
      })
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
