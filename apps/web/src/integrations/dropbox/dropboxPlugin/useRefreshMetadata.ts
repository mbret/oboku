import { requestDropboxSourceCredentials } from "./lib/auth"
import type { SourcePlugin } from "../../plugins/types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../../config/useConfig"

export const useRefreshMetadata: SourcePlugin<"dropbox">[`useRefreshMetadata`] =
  ({ requestPopup, meta }) => {
    const { data: config } = useConfig()

    return useMutation({
      meta,
      mutationFn: async function requestSourceCredentials() {
        return {
          providerCredentials: await requestDropboxSourceCredentials({
            requestPopup,
            clientId: config?.DROPBOX_CLIENT_ID,
          }),
        }
      },
    })
  }
