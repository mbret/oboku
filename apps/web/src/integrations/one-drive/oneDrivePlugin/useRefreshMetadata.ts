import { useMutation } from "@tanstack/react-query"
import type { SourcePlugin } from "../../plugins/types"
import { requestOneDriveSourceCredentials } from "./auth/auth"
import { useConfig } from "../../../config/useConfig"

export const useRefreshMetadata: SourcePlugin<"one-drive">["useRefreshMetadata"] =
  ({ requestPopup, meta }) => {
    const { data: config } = useConfig()

    return useMutation({
      meta,
      mutationFn: async () => {
        return {
          providerCredentials: await requestOneDriveSourceCredentials({
            interaction: "allow-interactive",
            minimumValidityMs: config?.MINIMUM_TOKEN_VALIDITY_MS,
            requestPopup,
          }),
        }
      },
    })
  }
