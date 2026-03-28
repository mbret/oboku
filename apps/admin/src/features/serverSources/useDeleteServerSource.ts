import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"
import { serverSourcesQueryKey } from "./useServerSources"

export const useDeleteServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync/sources/${id}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not delete server source",
          ),
        )
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })

      notifications.show({
        title: "Source deleted",
        message: "The server source has been deleted.",
        color: "green",
      })
    },
    onError: (error) => {
      notifications.show({
        title: "Delete failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
