import { API_QUERY_KEY_PREFIX } from "../queries/queryClient"

export const koreaderSyncQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync", profileId] as const
