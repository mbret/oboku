import { authUser } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import { mapDropboxAuthToProviderCredentials } from "./lib/credentials"

export const useRefreshMetadata: ObokuPlugin<"dropbox">[`useRefreshMetadata`] =
  ({ requestPopup }) => {
    return useMutation({
      mutationFn: async () => {
        const auth = await authUser({ requestPopup })

        return {
          providerCredentials: mapDropboxAuthToProviderCredentials(auth),
        }
      },
    })
  }
