import { useMutation } from "@tanstack/react-query"
import { requestOneDriveProviderCredentials } from "./auth/auth"
import type { ObokuPlugin } from "../types"

export const useSynchronize: ObokuPlugin<"one-drive">["useSynchronize"] = ({
  requestPopup,
}) => {
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
