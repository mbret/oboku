import { useMutation, useQueryClient } from "@tanstack/react-query"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { invalidateNotificationQueries } from "./keys"

export const useMarkAllNotificationsAsSeen = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await httpClientApi.fetch(`${configuration.API_URL}/notifications/seen`, {
        method: "POST",
      })
    },
    onSuccess: () => invalidateNotificationQueries(queryClient),
  })
}
