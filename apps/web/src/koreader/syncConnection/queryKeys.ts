import type { QueryClient } from "@tanstack/react-query"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

const koreaderSyncConnectionQueryKeyPrefix = [
  API_QUERY_KEY_PREFIX,
  "koreader-sync-connection",
] as const

export const koreaderSyncConnectionQueryKey = (profileId: string | undefined) =>
  [...koreaderSyncConnectionQueryKeyPrefix, profileId] as const

const KOREADER_SYNC_CONNECTION_GC_TIME_MS = 5 * 60 * 1000

/**
 * The reader stops pushing while the cache holds no connection, which a
 * refused push writes while no screen shows the connection: the cached answer
 * has to outlive that, and `setQueryData` builds the entry with the defaults.
 */
export const setKoreaderSyncConnectionQueryDefaults = (
  queryClient: QueryClient,
) => {
  queryClient.setQueryDefaults(koreaderSyncConnectionQueryKeyPrefix, {
    gcTime: KOREADER_SYNC_CONNECTION_GC_TIME_MS,
  })
}
