import { useMutation, useQueryClient } from "@tanstack/react-query"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { invalidateNotificationQueries } from "./keys"

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await httpClientApi.fetch(
        `${configuration.API_URL}/notifications/${id}/archive`,
        {
          method: "POST",
        },
      )
    },
    onSuccess: () => invalidateNotificationQueries(queryClient),
  })
}
