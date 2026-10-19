import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type KoreaderSyncConnectionPushPositionData,
  koreaderSyncConnectionPushPosition,
} from "@oboku/shared"
import { useRef } from "react"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import {
  isKoreaderSyncConnectionMissingError,
  isKoreaderSyncKeyRefusedError,
} from "./errors"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

/**
 * Pushes a position to the account's KOReader sync server, and does nothing
 * when the account has none. A push refused because the connection is gone
 * refreshes the cached connection. Once the server refuses the key, the pushes
 * from this hook stop, since each would be refused the same way.
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
  const isKeyRefusedRef = useRef(false)
  const connectionQueryOptions = createKoreaderSyncConnectionQueryOptions({
    httpClientApi,
    profileId: activeProfileId,
  })

  return useMutation({
    ...options,
    networkMode: "online",
    mutationFn: async function pushKoreaderPositionWhenConnected(
      position: KoreaderSyncConnectionPushPositionData["body"],
    ) {
      if (isKeyRefusedRef.current) return

      const { connection } = await queryClient.ensureQueryData(
        connectionQueryOptions,
      )

      if (!connection) return

      await koreaderSyncConnectionPushPosition({
        client: httpClientApi.sdkClient,
        body: position,
      })
    },
    onError: function noteUnusableKoreaderSyncConnection(error) {
      if (isKoreaderSyncKeyRefusedError(error)) {
        isKeyRefusedRef.current = true
      }

      if (isKoreaderSyncConnectionMissingError(error)) {
        return queryClient.invalidateQueries({
          queryKey: connectionQueryOptions.queryKey,
          refetchType: "all",
        })
      }
    },
  })
}
