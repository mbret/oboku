import { type QueryClient, useQuery } from "@tanstack/react-query"
import { getProfileRow } from "../profiles/dbHelpers"
import { migrateLegacyAuth } from "../profiles/migrateLegacyAuth"
import { useActiveProfileId } from "../profiles/activeProfile"
import type { AuthSession } from "./types"

export const authQueryKey = (activeProfileId: string | null | undefined) =>
  ["profile", activeProfileId ?? null] as const

export const authQueryOptions = (
  activeProfileId: string | null | undefined,
) => ({
  queryKey: authQueryKey(activeProfileId),
  queryFn: async (): Promise<AuthSession | null> => {
    await migrateLegacyAuth()

    if (!activeProfileId) return null

    return (await getProfileRow(activeProfileId)) ?? null
  },
  enabled: !!activeProfileId,
  staleTime: Infinity,
})

export const useAuthSession = () => {
  const activeProfileId = useActiveProfileId()

  return useQuery(authQueryOptions(activeProfileId))
}

export const ensureAuthSession = (
  queryClient: QueryClient,
  activeProfileId: string | null | undefined,
): Promise<AuthSession | null> => {
  if (!activeProfileId) return Promise.resolve(null)

  return queryClient.ensureQueryData(authQueryOptions(activeProfileId))
}
