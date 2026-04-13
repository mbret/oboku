import { useMutation } from "@tanstack/react-query"
import { configuration } from "../../config/configuration"
import { requestMicrosoftAccessToken } from "./auth/auth"
import { ONE_DRIVE_GRAPH_SCOPES } from "./constants"
import type { ObokuPlugin } from "../types"

export const useSynchronize: ObokuPlugin<"one-drive">["useSynchronize"] = ({
  requestPopup,
}) => {
  return useMutation({
    mutationFn: async () => {
      const authResult = await requestMicrosoftAccessToken({
        interaction: "allow-interactive",
        minimumValidityMs: configuration.MINIMUM_TOKEN_VALIDITY_MS,
        requestPopup,
        scopes: ONE_DRIVE_GRAPH_SCOPES,
      })

      return {
        providerCredentials: {
          accessToken: authResult.accessToken,
          expiresAt: authResult.expiresOn?.getTime() ?? null,
        },
      }
    },
  })
}
