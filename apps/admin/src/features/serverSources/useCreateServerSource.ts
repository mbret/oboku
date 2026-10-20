import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  type AdminCreateServerSourceData,
  adminCreateServerSource,
} from "@oboku/shared"
import { apiClient } from "../apiClient"
import { serverSourcesQueryKey } from "./useServerSources"

export const useCreateServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdminCreateServerSourceData["body"]) => {
      const { data } = await adminCreateServerSource({
        client: apiClient,
        body: input,
      })

      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })
    },
  })
}
