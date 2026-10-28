import { API_QUERY_KEY_PREFIX } from "../../../queries/queryClient"

export const koreaderSyncConnectionQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync-connection", profileId] as const
