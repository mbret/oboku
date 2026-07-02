import { type QueryClient, useQuery } from "@tanstack/react-query"
import { SIGNAL_RESET } from "reactjrx"
import {
  currentProfileSignal,
  getProfile,
  removeProfile,
  setProfile,
} from "./currentProfile"

export const activeProfileIdQueryKey = ["activeProfileId"] as const

/**
 * The active-account pointer stays in `localStorage` (source of truth) and is
 * mirrored into react-query so React consumers and the imperative interceptor
 * closures read it the same way. Seeded synchronously via `initialData` so the
 * bootstrap gate never flashes an unauthenticated state for a logged-in user.
 */
export const useActiveProfileId = () => {
  const { data } = useQuery({
    queryKey: activeProfileIdQueryKey,
    queryFn: () => getProfile() ?? null,
    initialData: () => getProfile() ?? null,
    staleTime: Infinity,
  })

  return data ?? null
}

export const getActiveProfileId = (queryClient: QueryClient) => {
  const cached = queryClient.getQueryData<string | null>(
    activeProfileIdQueryKey,
  )

  if (cached !== undefined) return cached

  return getProfile() ?? null
}

export const setActiveProfileId = (
  queryClient: QueryClient,
  nameHex: string,
) => {
  setProfile(nameHex)
  currentProfileSignal.update(nameHex)
  queryClient.setQueryData(activeProfileIdQueryKey, nameHex)
}

export const clearActiveProfileId = (queryClient: QueryClient) => {
  removeProfile()
  currentProfileSignal.setValue(SIGNAL_RESET)
  queryClient.setQueryData(activeProfileIdQueryKey, null)
}
