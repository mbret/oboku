import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import {
  type AdminDeleteServerSourceData,
  adminDeleteServerSource,
} from "@oboku/shared"
import { apiClient } from "../apiClient"
import { serverSourcesQueryKey } from "./useServerSources"

export const useDeleteServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (path: AdminDeleteServerSourceData["path"]) => {
      await adminDeleteServerSource({ client: apiClient, path })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })

      notifications.show({
        title: "Source deleted",
        message: "The server source has been deleted.",
        color: "green",
      })
    },
    onError: (error) => {
      notifications.show({
        title: "Delete failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
