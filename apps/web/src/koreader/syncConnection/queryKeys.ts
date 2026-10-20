import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

export const koreaderSyncConnectionQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync-connection", profileId] as const

export const koreaderSyncPositionQueryKey = ({
  profileId,
  document,
}: {
  profileId: string | undefined
  document: string | undefined
}) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync-position", profileId, document] as const
