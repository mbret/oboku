import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import { profilesBroadcast } from "./profilesBroadcast"
import type { Profile } from "./types"
import { profilesQueryKey } from "./useProfiles"

export const usePutProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: Profile) => dexieDb.profiles.put(profile),
    onMutate: async (profile: Profile) => {
      await queryClient.cancelQueries({ queryKey: profilesQueryKey })

      const previousProfiles = queryClient.getQueryData(profilesQueryKey)

      queryClient.setQueryData(
        profilesQueryKey,
        (profiles) =>
          profiles && [
            ...profiles.filter((existing) => existing.id !== profile.id),
            profile,
          ],
      )

      return { previousProfiles }
    },
    onError: (_error, _profile, context) => {
      queryClient.setQueryData(profilesQueryKey, context?.previousProfiles)
    },
    onSuccess: () => {
      profilesBroadcast.broadcast("profiles-changed")
    },
  })
}
