import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"
import { requestOneDriveProviderCredentials } from "./auth/auth"
import { useConfig } from "../../config/useConfig"

export const useRefreshMetadata: ObokuPlugin<"one-drive">["useRefreshMetadata"] =
  ({ requestPopup }) => {
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
