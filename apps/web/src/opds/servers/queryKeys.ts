import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

export const opdsServersQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "opds-servers", profileId] as const
