import { useMutation } from "@tanstack/react-query"
import { requestOneDriveProviderCredentials } from "./auth/auth"
import type { ObokuPlugin } from "../types"
import { useConfig } from "../../config/useConfig"

export const useSynchronize: ObokuPlugin<"one-drive">["useSynchronize"] = ({
  requestPopup,
}) => {
  const { data: config } = useConfig()

  return useMutation({
    mutationFn: async () => {
      return {
        providerCredentials: await requestOneDriveProviderCredentials({
          interaction: "allow-interactive",
          minimumValidityMs: config?.MINIMUM_TOKEN_VALIDITY_MS,
          requestPopup,
        }),
      }
    },
  })
}
