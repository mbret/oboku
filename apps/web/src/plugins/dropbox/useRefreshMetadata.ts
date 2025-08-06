import { authUser } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import type { DropboxSyncData } from "@oboku/shared"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  return useMutation({
    mutationFn: async () => {
      const auth = await authUser({ requestPopup })

      return {
        data: {
          accessToken: auth.getAccessToken(),
          accessTokenExpiresAt: auth.getAccessTokenExpiresAt().toISOString(),
          clientId: auth.getClientId(),
          refreshToken: auth.getRefreshToken(),
          codeVerifier: auth.getCodeVerifier(),
        } satisfies DropboxSyncData,
      }
    },
  })
}
