import { requestDropboxProviderCredentials } from "./lib/auth"
import type { UseSynchronizeHook } from "../../../plugins/types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../../config/useConfig"

export const useSynchronize: UseSynchronizeHook<"dropbox"> = ({
  requestPopup,
}) => {
  const { data: config } = useConfig()

  return useMutation({
    mutationFn: async function requestProviderCredentials() {
      return {
        providerCredentials: await requestDropboxProviderCredentials({
          requestPopup,
          clientId: config?.DROPBOX_CLIENT_ID,
        }),
      }
    },
  })
}
