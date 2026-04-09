import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"
import { readResponseErrorMessage } from "./readResponseErrorMessage"
import { instanceSettingsQueryKey } from "./useInstanceSettings"
import type {
  UpdateInstanceSettingsRequest,
  UpdateInstanceSettingsResponse,
} from "@oboku/shared"

export const useUpdateInstanceSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      body: UpdateInstanceSettingsRequest,
    ): Promise<UpdateInstanceSettingsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not update instance settings",
          ),
        )
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceSettingsQueryKey,
      })

      notifications.show({
        title: "Settings updated",
        message: "Instance settings have been saved.",
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
