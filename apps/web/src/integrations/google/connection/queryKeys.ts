import { API_QUERY_KEY_PREFIX } from "../../../queries/queryClient"

export const googleConnectionQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "google-connection", profileId] as const
