import {
  type DefaultError,
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query"
import { STORAGE_PERSISTENCE_QUERY_KEY } from "./useIsStoragePersisted"

export const useRequestStoragePersistence = (
  options?: Pick<UseMutationOptions<boolean, DefaultError, void>, "meta">,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: () => navigator.storage.persist(),
    onSuccess: function refreshPersistedState() {
      void queryClient.invalidateQueries({
        queryKey: STORAGE_PERSISTENCE_QUERY_KEY,
      })
    },
  })
}
