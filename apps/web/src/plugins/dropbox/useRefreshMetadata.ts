import { requestDropboxProviderCredentials } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../config/useConfig"

export const useRefreshMetadata: ObokuPlugin<"dropbox">[`useRefreshMetadata`] =
  ({ requestPopup, meta }) => {
    const { data: config } = useConfig()

    return useMutation({
      meta,
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
