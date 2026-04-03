import { memo, type ReactNode } from "react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { API_QUERY_KEY_PREFIX, queryClient } from "./queryClient"
import { persister } from "./persister"
import { defaultShouldDehydrateQuery } from "@tanstack/react-query"
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
        dehydrateOptions: {
          // Only persist API-backed queries (prefixed with "api"). Queries backed
          // by rxdb (prefixed with "rxdb") are already persisted locally and don't
          // need to go through the query cache persister.
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) &&
            query.queryKey[0] === API_QUERY_KEY_PREFIX,
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
