import { useMutation } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import type {
  SendAdminEmailRequest,
  SendAdminEmailResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

export const useSendAdminEmail = () => {
  return useMutation({
    mutationFn: async (
      input: SendAdminEmailRequest,
    ): Promise<SendAdminEmailResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/email`,
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
          await readResponseErrorMessage(response, "Could not send email"),
        )
      }

      return response.json()
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Email sent",
        message: `Delivered to ${data.deliveredCount} of ${data.recipientCount} recipient${data.recipientCount === 1 ? "" : "s"}${
          data.failedCount > 0 ? ` (${data.failedCount} failed)` : ""
        }.`,
        color: data.failedCount > 0 ? "yellow" : "green",
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
