import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  AdminCreateServerSourceData,
  AdminCreateServerSourceResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"
import { serverSourcesQueryKey } from "./useServerSources"

export const useCreateServerSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: AdminCreateServerSourceData["body"],
    ): Promise<AdminCreateServerSourceResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync/sources`,
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
            "Could not create server source",
          ),
        )
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: serverSourcesQueryKey,
      })
    },
  })
}
