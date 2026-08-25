import type { MutationKey, QueryClient } from "@tanstack/react-query"
import {
  type NotificationCacheSnapshot,
  cancelAndSnapshotNotificationQueries,
  invalidateNotificationQueries,
  rollbackNotificationCaches,
} from "./queryKeys"

/**
 * Wires the snapshot / rollback / invalidation cycle every optimistic
 * notification mutation shares. Only `applyOptimisticUpdate` differs between
 * them: it writes the mutation's own view of the notification caches, from the
 * snapshot taken before the request goes out.
 */
export const createNotificationMutationOptions = <TVariables, TData>({
  queryClient,
  profileId,
  mutationKey,
  mutationFn,
  applyOptimisticUpdate,
}: {
  queryClient: QueryClient
  profileId: string | undefined
  mutationKey: MutationKey
  mutationFn: (variables: TVariables) => Promise<TData>
  applyOptimisticUpdate: (
    variables: TVariables,
    snapshot: NotificationCacheSnapshot,
  ) => void
}) => ({
  mutationKey,
  networkMode: "online" as const,
  mutationFn,
  onMutate: async (variables: TVariables) => {
    const snapshot = await cancelAndSnapshotNotificationQueries(
      queryClient,
      profileId,
    )

    applyOptimisticUpdate(variables, snapshot)

    return snapshot
  },
  onError: (
    _err: unknown,
    _vars: TVariables,
    context: NotificationCacheSnapshot | undefined,
  ) => rollbackNotificationCaches(queryClient, profileId, context),
  onSettled: () => invalidateNotificationQueries(queryClient, profileId),
})
