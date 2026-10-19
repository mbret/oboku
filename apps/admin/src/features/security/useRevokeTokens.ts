import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import { type AdminRevokeTokensData, adminRevokeTokens } from "@oboku/shared"
import { apiClient } from "../apiClient"
import { tokenStatsQueryKey } from "./useTokenStats"

export const useRevokeTokens = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdminRevokeTokensData["body"]) => {
      const { data } = await adminRevokeTokens({
        client: apiClient,
        body: input,
      })

      return data
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
