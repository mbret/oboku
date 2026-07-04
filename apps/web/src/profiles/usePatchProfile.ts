import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"
import { profileByIdQueryKey } from "./useProfileById"

type ProfilePatch = Pick<Profile, "id"> & Partial<Omit<Profile, "id">>

export const usePatchProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...patch }: ProfilePatch) =>
      dexieDb.profiles.update(id, patch),
    onMutate: async ({ id, ...patch }: ProfilePatch) => {
      await queryClient.cancelQueries({ queryKey: profileByIdQueryKey(id) })

      const previousProfile = queryClient.getQueryData(profileByIdQueryKey(id))

      queryClient.setQueryData(profileByIdQueryKey(id), (profile) =>
        profile ? { ...profile, ...patch } : profile,
      )

      return { previousProfile }
    },
    onError: (_error, { id }, context) => {
      queryClient.setQueryData(
        profileByIdQueryKey(id),
        context?.previousProfile,
      )
    },
  })
}
