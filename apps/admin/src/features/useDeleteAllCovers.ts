import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminDeleteAllCovers } from "@oboku/shared"
import { coverCleanupStatsQueryKey } from "./useCoverCleanupStats"
import { apiClient } from "./apiClient"

export const useDeleteAllCovers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await adminDeleteAllCovers({ client: apiClient })

      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: coverCleanupStatsQueryKey,
      })
    },
  })
}
