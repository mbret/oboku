import { signal } from "reactjrx"
import { STORAGE_PROFILE_KEY } from "../../config/envs"
import { type QueryClient, useQuery } from "@tanstack/react-query"
import { SIGNAL_RESET } from "reactjrx"

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
  activeProfileSignal.update(nameHex)
  queryClient.setQueryData(activeProfileIdQueryKey, nameHex)
}

export const clearActiveProfileId = (queryClient: QueryClient) => {
  removeProfile()
  activeProfileSignal.setValue(SIGNAL_RESET)
  queryClient.setQueryData(activeProfileIdQueryKey, null)
}

export const getProfile = () => {
  return localStorage.getItem(STORAGE_PROFILE_KEY) || undefined
}

export const activeProfileSignal = signal<string | undefined>({
  default: getProfile() || undefined,
})

export const setProfile = (profile: string) => {
  localStorage.setItem(STORAGE_PROFILE_KEY, profile)
}

export const removeProfile = () => {
  localStorage.removeItem(STORAGE_PROFILE_KEY)
}
