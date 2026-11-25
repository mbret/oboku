import { useMutation } from "@tanstack/react-query"
import { requestOneDriveSourceCredentials } from "./auth/auth"
import type { SourcePlugin } from "../../plugins/types"
import { useConfig } from "../../../config/useConfig"

export const useSynchronize: SourcePlugin<"one-drive">["useSynchronize"] = ({
  requestPopup,
}) => {
  const { data: config } = useConfig()

  return useMutation({
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
