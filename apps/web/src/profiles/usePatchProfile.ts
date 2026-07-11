import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import { profilesBroadcast } from "./profilesBroadcast"
import type { Profile } from "./types"
import { profilesQueryKey } from "./useProfiles"

type ProfilePatch = Pick<Profile, "id"> & Partial<Omit<Profile, "id">>

export const usePatchProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...patch }: ProfilePatch) =>
      dexieDb.profiles.update(id, patch),
    onMutate: async ({ id, ...patch }: ProfilePatch) => {
      await queryClient.cancelQueries({ queryKey: profilesQueryKey })

      const previousProfiles = queryClient.getQueryData(profilesQueryKey)

      queryClient.setQueryData(profilesQueryKey, (profiles) =>
        profiles?.map((profile) =>
          profile.id === id ? { ...profile, ...patch } : profile,
        ),
      )

      return { previousProfiles }
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(profilesQueryKey, context?.previousProfiles)
    },
    onSuccess: () => {
      profilesBroadcast.broadcast("profiles-changed")
    },
  })
}
