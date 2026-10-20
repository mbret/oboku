import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import {
  type AdminUpdateSettingsData,
  adminUpdateSettings,
} from "@oboku/shared"
import { apiClient } from "./apiClient"
import { instanceSettingsQueryKey } from "./useInstanceSettings"

export const useUpdateInstanceSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: AdminUpdateSettingsData["body"]) => {
      const { data } = await adminUpdateSettings({ client: apiClient, body })

      return data
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
