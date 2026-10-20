import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

export const koreaderSyncConnectionQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "koreader-sync-connection", profileId] as const

export const koreaderSyncPositionQueryKey = ({
  profileId,
  bookId,
  document,
}: {
  profileId: string | undefined
  bookId: string
  document: string | undefined
}) =>
  [
    API_QUERY_KEY_PREFIX,
    "koreader-sync-position",
    profileId,
    bookId,
    document,
  ] as const
