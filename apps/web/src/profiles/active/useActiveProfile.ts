import { useSignalValue } from "reactjrx"
import { activeProfileIdSignal } from "./activeProfileId"
import type { QueryClient } from "@tanstack/react-query"
import { useProfileById } from "../useProfileById"
import { profilesQueryOptions } from "../useProfiles"

export const useActiveProfile = () => {
  const activeProfileId = useSignalValue(activeProfileIdSignal)

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
