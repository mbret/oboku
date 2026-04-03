import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import type {
  CreateAdminNotificationRequest,
  CreateAdminNotificationResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { adminNotificationsQueryKey } from "./useAdminNotifications"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

export const useCreateAdminNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: CreateAdminNotificationRequest,
    ): Promise<CreateAdminNotificationResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/notifications`,
        {
          method: "POST",
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
            "Could not send notification",
          ),
        )
      }

      return response.json()
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
