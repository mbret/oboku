import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import {
  type AdminUpdateServerSourceData,
  adminUpdateServerSource,
} from "@oboku/shared"
import { apiClient } from "../apiClient"
import { serverSourcesQueryKey } from "./useServerSources"

type UpdateServerSourceVariables = AdminUpdateServerSourceData["path"] &
  AdminUpdateServerSourceData["body"]

export const useUpdateServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateServerSourceVariables) => {
      const { data } = await adminUpdateServerSource({
        client: apiClient,
        path: { id },
        body: input,
      })

      return data
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
