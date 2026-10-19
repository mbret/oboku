import type { KoreaderSyncConnectionGetResponse } from "@oboku/shared"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { koreaderSyncConnectionQueryKey } from "./queryKeys"

/**
 * Whether the cache knows the account has no KOReader sync connection, from
 * the connection query or a refused push. It never asks the API: an unknown
 * connection is not a missing one. The returned function keeps working once
 * the component that got it has unmounted.
 */
export const useIsKoreaderSyncDisconnected = () => {
  const queryClient = useQueryClient()
  const activeProfileId = useActiveProfileId()

  return useCallback(
    function isKoreaderSyncDisconnected() {
      const cachedConnection =
        queryClient.getQueryData<KoreaderSyncConnectionGetResponse>(
          koreaderSyncConnectionQueryKey(activeProfileId),
        )

      return cachedConnection?.connection === null
    },
    [queryClient, activeProfileId],
  )
}
