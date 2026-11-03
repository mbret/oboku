import { API_QUERY_KEY_PREFIX } from "../../../queries/queryClient"

export const koreaderSyncServerQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync-server", profileId] as const
