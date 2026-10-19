import { useMutation } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { type AdminSendEmailData, adminSendEmail } from "@oboku/shared"
import { apiClient } from "../apiClient"

export const useSendAdminEmail = () => {
  return useMutation({
    mutationFn: async (input: AdminSendEmailData["body"]) => {
      const { data } = await adminSendEmail({ client: apiClient, body: input })

      return data
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Broadcast started",
        message: `Sending to ${data.recipientCount} recipient${
          data.recipientCount === 1 ? "" : "s"
        }. Delivery runs in the background.`,
        color: "green",
      })
    },
    onError: (error) => {
      notifications.show({
        title: "Email failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
