import { memo, type ReactNode, useState } from "react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query"
import { SwitchMutationCancelError } from "reactjrx"
import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { CancelError } from "../errors/errors.shared"
import { HttpClientError } from "../http/httpClient.shared"
import { notifyError } from "../notifications/toasts"
import {
  archiveMutationKey,
  markAllSeenMutationKey,
  markSeenMutationKey,
} from "../notifications/inbox/queryKeys"
import { markSeenMutationOptions } from "../notifications/inbox/useMarkNotificationAsSeen"
import { markAllSeenMutationOptions } from "../notifications/inbox/useMarkAllNotificationsAsSeen"
import { archiveMutationOptions } from "../notifications/inbox/useArchiveNotification"
import { type HttpApiClientWeb, useHttpClientApi } from "../http"
import { API_QUERY_KEY_PREFIX } from "./queryClient"
import { persistBuster, persister } from "./persister"

const createQueryClient = (httpClientApi: HttpApiClientWeb) => {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (
          error instanceof CancelError ||
          error instanceof SwitchMutationCancelError
        )
          return

        const isUnauthorized =
          error instanceof HttpClientError && error.response?.status === 401

        if (isDebugEnabled() && !import.meta.env.DEV && !isUnauthorized) {
          alert(String(error))
        }

        console.error(error)

        if (!mutation.options.meta?.suppressGlobalErrorToast) {
          notifyError(error)
        }
      },
    }),
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof CancelError) return

        console.error(error)
      },
    }),
    defaultOptions: {
      mutations: {
        /**
         * @important
         * Same as for queries, most of mutations are offline by default.
         * Don't forget to change it when needed
         */
        networkMode: "always",
      },
      queries: {
        /**
         * @important
         * By default we do not want queries using data from rxdb to use cache when mounting
         * This is because we might result in invalid data for a short period of time.
         * If cache should be used for a specific query, make sure to setData whenever
         * rxdb change with middleware. However since it's harder to maintain we just don't
         * use cache by default.
         */
        gcTime: 0,
      },
    },
  })

  queryClient.setMutationDefaults(
    markSeenMutationKey,
    markSeenMutationOptions(queryClient, httpClientApi),
  )
  queryClient.setMutationDefaults(
    markAllSeenMutationKey,
    markAllSeenMutationOptions(queryClient, httpClientApi),
  )
  queryClient.setMutationDefaults(
    archiveMutationKey,
    archiveMutationOptions(queryClient, httpClientApi),
  )

  return queryClient
}

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

export const QueryClientProvider = memo(function QueryClientProvider({
  children,
}: {
  children: ReactNode
}) {
  const httpClientApi = useHttpClientApi()
  const [queryClient] = useState(() => createQueryClient(httpClientApi))

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: persistBuster,
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
