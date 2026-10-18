import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import type {
  AdminUpdateServerSourceData,
  AdminUpdateServerSourceResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"
import { serverSourcesQueryKey } from "./useServerSources"

type UpdateServerSourceVariables = AdminUpdateServerSourceData["path"] &
  AdminUpdateServerSourceData["body"]

export const useUpdateServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateServerSourceVariables): Promise<AdminUpdateServerSourceResponse> => {
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
    onSuccess: async (savedSource) => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })

      notifications.show({
        title: "Source updated",
        message: `"${savedSource.name}" has been saved.`,
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
