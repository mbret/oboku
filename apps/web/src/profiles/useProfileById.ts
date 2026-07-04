import { queryOptions, useQuery } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"

export const profileByIdQueryOptions = (profileId: string | null | undefined) =>
  queryOptions({
    queryKey: ["profile", profileId ?? null] as const,
    queryFn: async (): Promise<Profile | null> => {
      if (!profileId) return null

      return (await dexieDb.profiles.get(profileId)) ?? null
    },
    enabled: !!profileId,
    staleTime: Infinity,
  })

export const profileByIdQueryKey = (profileId: string | null | undefined) =>
  profileByIdQueryOptions(profileId).queryKey

export const useProfileById = (profileId: string | null | undefined) => {
  return useQuery(profileByIdQueryOptions(profileId))
}
