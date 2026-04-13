import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"
import { requestOneDriveProviderCredentials } from "./auth/auth"

export const useRefreshMetadata: ObokuPlugin<"one-drive">["useRefreshMetadata"] =
  ({ requestPopup }) => {
    return useMutation({
      mutationFn: async () => {
        return {
          providerCredentials: await requestOneDriveProviderCredentials({
            interaction: "allow-interactive",
            requestPopup,
          }),
        }
      },
    })
  }
