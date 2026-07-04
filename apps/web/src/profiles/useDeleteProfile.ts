import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import { profileByIdQueryKey } from "./useProfileById"

export const useDeleteProfile = (
  options?: Pick<UseMutationOptions<void, DefaultError, string>, "meta">,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (profileId: string) => dexieDb.profiles.delete(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.removeQueries({
        queryKey: profileByIdQueryKey(profileId),
      })
    },
  })
}
