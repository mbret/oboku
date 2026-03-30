import { useMutation, useQueryClient } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"
import { instanceSettingsQueryKey } from "./useInstanceSettings"
import type {
  UpdateInstanceSettingsRequest,
  UpdateInstanceSettingsResponse,
} from "@oboku/shared"

export const useUpdateInstanceSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      body: UpdateInstanceSettingsRequest,
    ): Promise<UpdateInstanceSettingsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        throw new Error(
          response.statusText || "Could not update instance settings",
        )
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceSettingsQueryKey,
      })
    },
  })
}
