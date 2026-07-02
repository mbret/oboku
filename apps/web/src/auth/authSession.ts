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

export const getAuthSession = (
  queryClient: QueryClient,
  activeProfileId: string | null | undefined,
): AuthSession | null => {
  if (!activeProfileId) return null

  return (
    queryClient.getQueryData<AuthSession | null>(
      authQueryKey(activeProfileId),
    ) ?? null
  )
}

export const useIsAuthHydrated = () => {
  const activeProfileId = useActiveProfileId()
  const { isFetched } = useAuthSession()

  return !activeProfileId || isFetched
}
