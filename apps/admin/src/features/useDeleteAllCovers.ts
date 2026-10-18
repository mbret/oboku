import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { AdminDeleteAllCoversResponse } from "@oboku/shared"
import { config } from "@/config"
import { coverCleanupStatsQueryKey } from "./useCoverCleanupStats"
import { authenticatedFetch } from "./authenticatedFetch"

export const useDeleteAllCovers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<AdminDeleteAllCoversResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/covers/delete-all`,
        {
          method: "POST",
        },
      )

      if (!response.ok) {
        throw new Error(response.statusText || "Could not delete all covers")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: coverCleanupStatsQueryKey,
      })
    },
  })
}
