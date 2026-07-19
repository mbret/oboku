import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import { profilesBroadcast } from "./profilesBroadcast"
import { profilesQueryKey } from "./useProfiles"

export const useDeleteProfile = (
  options?: Pick<UseMutationOptions<void, DefaultError, string>, "meta">,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (profileId: string) => dexieDb.profiles.delete(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.setQueryData(profilesQueryKey, (profiles) =>
        profiles?.filter((profile) => profile.id !== profileId),
      )
      profilesBroadcast.broadcast("profiles-changed")
    },
  })
}
