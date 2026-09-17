import { type UseMutationOptions, useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"

export const useDownloadCredentials: NonNullable<
  ObokuPlugin<"URI">["useDownloadCredentials"]
> = ({ meta }: Pick<UseMutationOptions, "meta"> = {}) =>
  useMutation({
    meta,
    mutationFn: async () => ({ providerCredentials: {} }),
  })
