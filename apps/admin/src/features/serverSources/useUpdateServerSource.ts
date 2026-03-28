import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"
import { serverSourcesQueryKey, type ServerSource } from "./useServerSources"

export type UpdateServerSourceInput = {
  id: string
  name: string
  path: string
  enabled: boolean
}

export const useUpdateServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateServerSourceInput): Promise<ServerSource> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync/sources/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not update server source",
          ),
        )
      }

      return response.json()
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })

      notifications.show({
        title: "Source updated",
        message: `"${variables.name}" has been saved.`,
        color: "green",
      })
    },
    onError: (error) => {
      notifications.show({
        title: "Update failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
