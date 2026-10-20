import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import {
  type AdminCreateNotificationData,
  adminCreateNotification,
} from "@oboku/shared"
import { apiClient } from "../apiClient"
import { adminNotificationsQueryKey } from "./useAdminNotifications"

export const useCreateAdminNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdminCreateNotificationData["body"]) => {
      const { data } = await adminCreateNotification({
        client: apiClient,
        body: input,
      })

      return data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKey,
      })

      notifications.show({
        title: "Notification sent",
        message: `Delivered to ${data.deliveredCount} user${data.deliveredCount === 1 ? "" : "s"}.`,
        color: "green",
      })
    },
    onError: (error) => {
      notifications.show({
        title: "Notification failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
