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
 * refreshes the cached connection. Once the server refuses the key, pushes stop
 * until the account connects again, since each would be refused the same way.
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
  const refusedKeyConnectedAtRef = useRef<string | undefined>(undefined)
  const connectionQueryOptions = createKoreaderSyncConnectionQueryOptions({
    httpClientApi,
    profileId: activeProfileId,
  })

  return useMutation({
    ...options,
    networkMode: "online",
    // One at a time, in the order they were made: the last position made is
    // the one the server keeps.
    scope: { id: "koreader-sync-push" },
    mutationFn: async function pushKoreaderPositionWhenConnected(
      position: KoreaderSyncConnectionPushPositionData["body"],
    ) {
      const { connection } = await queryClient.ensureQueryData(
        connectionQueryOptions,
      )

      if (!connection) return

      const isKeyRefused =
        connection.connectedAt === refusedKeyConnectedAtRef.current

      if (isKeyRefused) return

      await koreaderSyncConnectionPushPosition({
        client: httpClientApi.sdkClient,
        body: position,
      })
    },
    onError: function noteUnusableKoreaderSyncConnection(error) {
      if (isKoreaderSyncKeyRefusedError(error)) {
        refusedKeyConnectedAtRef.current = queryClient.getQueryData(
          connectionQueryOptions.queryKey,
        )?.connection?.connectedAt
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
