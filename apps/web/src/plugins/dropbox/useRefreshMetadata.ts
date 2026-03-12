import { authUser } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"

export const useRefreshMetadata: ObokuPlugin<"dropbox">[`useRefreshMetadata`] =
  ({ requestPopup }) => {
    return useMutation({
      mutationFn: async () => {
        const auth = await authUser({ requestPopup })

        return {
          providerCredentials: {
            accessToken: auth.getAccessToken(),
            accessTokenExpiresAt: auth.getAccessTokenExpiresAt().toISOString(),
            clientId: auth.getClientId(),
            refreshToken: auth.getRefreshToken(),
            codeVerifier: auth.getCodeVerifier(),
          },
        }
      },
    })
  }
