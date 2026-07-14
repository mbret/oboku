import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import type { Profile } from "./types"
import { profilesQueryOptions } from "./useProfiles"

export const useProfileById = (profileId: string | null | undefined) => {
  return useQuery({
    ...profilesQueryOptions,
    select: useCallback(
      function selectProfileById(profiles: Profile[]) {
        return profiles.find((profile) => profile.id === profileId) ?? null
      },
      [profileId],
    ),
  })
}
