import { dexieDb } from "../rxdb/dexie"
import { useQuery } from "@tanstack/react-query"

export const profileByIdQueryKey = (profileId: string | null | undefined) =>
  ["profile", profileId ?? null] as const

export const profileByIdQueryOptions = (
  profileId: string | null | undefined,
) => ({
  queryKey: profileByIdQueryKey(profileId),
  queryFn: async () => {
    if (!profileId) return null

    return (await dexieDb.profiles.get(profileId)) ?? null
  },
  enabled: !!profileId,
  staleTime: Infinity,
})

export const useProfileById = (profileId: string | null | undefined) => {
  return useQuery(profileByIdQueryOptions(profileId))
}
