import { useActiveProfileId } from "./activeProfileId"
import type { QueryClient } from "@tanstack/react-query"
import { useProfileById } from "../useProfileById"
import { profilesQueryOptions } from "../useProfiles"

export const useActiveProfile = () => {
  const activeProfileId = useActiveProfileId()

  return useProfileById(activeProfileId)
}

export const ensureActiveProfile = async (
  queryClient: QueryClient,
  activeProfileId: string | null | undefined,
) => {
  if (!activeProfileId) return null

  const profiles = await queryClient.ensureQueryData(profilesQueryOptions)

  return profiles.find((profile) => profile.id === activeProfileId) ?? null
}
