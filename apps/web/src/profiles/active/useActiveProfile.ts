import { useSignalValue } from "reactjrx"
import { activeProfileIdSignal } from "./activeProfileId"
import type { QueryClient } from "@tanstack/react-query"
import { profileByIdQueryOptions, useProfileById } from "../useProfileById"

export const useActiveProfile = () => {
  const activeProfileId = useSignalValue(activeProfileIdSignal)

  return useProfileById(activeProfileId)
}

export const ensureActiveProfile = (
  queryClient: QueryClient,
  activeProfileId: string | null | undefined,
) => {
  if (!activeProfileId) return Promise.resolve(null)

  return queryClient.ensureQueryData(profileByIdQueryOptions(activeProfileId))
}
