import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"
import { profileByIdQueryKey } from "./useProfileById"

export const usePutProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: Profile) => dexieDb.profiles.put(profile),
    onMutate: async (profile: Profile) => {
      await queryClient.cancelQueries({
        queryKey: profileByIdQueryKey(profile.id),
      })

      const previousProfile = queryClient.getQueryData(
        profileByIdQueryKey(profile.id),
      )

      queryClient.setQueryData(profileByIdQueryKey(profile.id), profile)

      return { previousProfile }
    },
    onError: (_error, profile, context) => {
      queryClient.setQueryData(
        profileByIdQueryKey(profile.id),
        context?.previousProfile,
      )
    },
  })
}
