import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"

export const useDownloadCredentials: NonNullable<
  ObokuPlugin<"URI">["useDownloadCredentials"]
> = () =>
  useMutation({
    mutationFn: async () => ({ providerCredentials: {} }),
  })
