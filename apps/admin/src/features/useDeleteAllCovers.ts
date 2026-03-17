import { useMutation, useQueryClient } from "@tanstack/react-query"
import { config } from "@/config"
import { coverCleanupStatsQueryKey } from "./useCoverCleanupStats"
import { authenticatedFetch } from "./authenticatedFetch"

export type DeleteAllCoversResult = {
  deletedCovers: number
  deletedSizeInBytes: number
  failedCovers: number
  failedKeys: Array<{ key: string; message: string }>
}

export const useDeleteAllCovers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<DeleteAllCoversResult> => {
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
