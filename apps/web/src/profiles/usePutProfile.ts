import { useMutation, useQueryClient } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"
import { profileByIdQueryKey } from "./useProfileById"

export const usePutProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: Profile) => {
      queryClient.setQueryData(profileByIdQueryKey(profile.id), profile)

      return dexieDb.profiles.put(profile)
    },
  })
}
