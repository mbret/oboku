import { authUser } from "./lib/auth"
import type { UseSynchronizeHook } from "../types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../config/useConfig"

export const useSynchronize: UseSynchronizeHook<"dropbox"> = ({
  requestPopup,
}) => {
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
          codeVerifier: auth.getCodeVerifier(),
          refreshToken: auth.getRefreshToken(),
        },
      }
    },
  })
}
