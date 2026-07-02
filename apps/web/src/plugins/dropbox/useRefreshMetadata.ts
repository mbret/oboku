import { authUser } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../config/useConfig"

export const useRefreshMetadata: ObokuPlugin<"dropbox">[`useRefreshMetadata`] =
  ({ requestPopup }) => {
    const { data: config } = useConfig()

    return useMutation({
      mutationFn: async () => {
        const auth = await authUser({
          requestPopup,
          clientId: config?.DROPBOX_CLIENT_ID,
        })

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
