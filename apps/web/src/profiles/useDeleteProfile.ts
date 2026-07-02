import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import { profileByIdQueryKey } from "./useProfileById"

export const useDeleteProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => dexieDb.profiles.delete(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.removeQueries({
        queryKey: profileByIdQueryKey(profileId),
      })
    },
  })
}
