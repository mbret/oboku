import { queryOptions, useQuery } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"

export const profilesQueryOptions = queryOptions({
  queryKey: ["profiles"] as const,
  queryFn: async (): Promise<Profile[]> => dexieDb.profiles.toArray(),
  staleTime: Infinity,
})

export const profilesQueryKey = profilesQueryOptions.queryKey

export const useProfiles = () => useQuery(profilesQueryOptions)
