import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"

export const useRefreshMetadata: ObokuPlugin<"URI">["useRefreshMetadata"] =
  () => {
    return useMutation({
      mutationFn: async () => ({
        providerCredentials: {},
      }),
    })
  }
