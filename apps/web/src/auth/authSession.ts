import { getProfileRow } from "../profiles/dbHelpers"
import type { AuthSession } from "./types"

export const profileByIdQueryKey = (profileId: string | null | undefined) =>
  ["profile", profileId ?? null] as const

export const profileByIdQueryOptions = (
  profileId: string | null | undefined,
) => ({
  queryKey: profileByIdQueryKey(profileId),
  queryFn: async (): Promise<AuthSession | null> => {
    if (!profileId) return null

    return (await getProfileRow(profileId)) ?? null
  },
  enabled: !!profileId,
  staleTime: Infinity,
})
