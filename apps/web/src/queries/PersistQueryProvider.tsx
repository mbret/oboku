import { memo, type ReactNode } from "react"
import { version } from "../../package.json"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { API_QUERY_KEY_PREFIX, queryClient } from "./queryClient"
import { persister } from "./persister"
import {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query"
import {
  markSeenMutationKey,
  markAllSeenMutationKey,
  archiveMutationKey,
} from "../notifications/inbox/queryKeys"
import { markSeenMutationOptions } from "../notifications/inbox/useMarkNotificationAsSeen"
import { markAllSeenMutationOptions } from "../notifications/inbox/useMarkAllNotificationsAsSeen"
import { archiveMutationOptions } from "../notifications/inbox/useArchiveNotification"

queryClient.setMutationDefaults(
  markSeenMutationKey,
  markSeenMutationOptions(queryClient),
)
queryClient.setMutationDefaults(
  markAllSeenMutationKey,
  markAllSeenMutationOptions(queryClient),
)
queryClient.setMutationDefaults(
  archiveMutationKey,
  archiveMutationOptions(queryClient),
)

/**
 * Only mutations whose keys are registered above via `setMutationDefaults` can
 * be resumed after a reload — that registration is the only way react-query can
 * reconstruct the (non-serializable) `mutationFn`. Persisting any other paused
 * mutation (e.g. a stale one from an older build, or one with a key we no longer
 * register) leads to "No mutationFn found" when `resumePausedMutations` runs.
 */
const resumableMutationKeys = [
  markSeenMutationKey,
  markAllSeenMutationKey,
  archiveMutationKey,
]

const isResumableMutationKey = (mutationKey: unknown) =>
  resumableMutationKeys.some(
    (key) => JSON.stringify(mutationKey) === JSON.stringify(key),
  )

export const PersistQueryProvider = memo(function PersistQueryProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Bump the cache namespace per release so paused mutations / queries
        // persisted by an older build (potentially with keys we no longer
        // register) are discarded instead of restored.
        buster: version,
        dehydrateOptions: {
          // Only persist API-backed queries (prefixed with "api"). Queries backed
          // by rxdb (prefixed with "rxdb") are already persisted locally and don't
          // need to go through the query cache persister.
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) &&
            query.queryKey[0] === API_QUERY_KEY_PREFIX,
          // Only persist mutations we can actually resume (see above).
          shouldDehydrateMutation: (mutation) =>
            defaultShouldDehydrateMutation(mutation) &&
            isResumableMutationKey(mutation.options.mutationKey),
        },
      }}
      onSuccess={() => {
        queryClient.resumePausedMutations()
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
})
