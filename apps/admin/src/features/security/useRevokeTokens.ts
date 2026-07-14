import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import type { RevokeTokensRequest, RevokeTokensResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"
import { tokenStatsQueryKey } from "./useTokenStats"

export const useRevokeTokens = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: RevokeTokensRequest,
    ): Promise<RevokeTokensResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/tokens/revoke`,
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
          await readResponseErrorMessage(response, "Could not revoke tokens"),
        )
      }

      return response.json()
    },
    onSuccess: async (data) => {
      notifications.show({
        title: "Tokens revoked",
        message:
          data.targetedUsers === null
            ? `Revoked all ${data.revokedTokens} refresh token(s). Every session is now signed out.`
            : `Revoked ${data.revokedTokens} refresh token(s) across ${data.targetedUsers} user(s).`,
        color: "green",
      })

      await queryClient.invalidateQueries({ queryKey: tokenStatsQueryKey })
    },
    onError: (error) => {
      notifications.show({
        title: "Revoke failed",
        message: error.message,
        color: "red",
      })
    },
  })
}
