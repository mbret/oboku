import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"

export const useRefreshMetadata: ObokuPlugin<"file">["useRefreshMetadata"] =
  () => {
    return useMutation({
      mutationFn: async () => ({
        providerCredentials: {},
      }),
    })
  }
