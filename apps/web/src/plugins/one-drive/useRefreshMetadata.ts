import { useMutation } from "@tanstack/react-query"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"

export const useRefreshMetadata: ObokuPlugin<"one-drive">["useRefreshMetadata"] =
  () => {
    return useMutation({
      mutationFn: async () => {
        throw new UnsupportedMethodError(
          "OneDrive metadata refresh is not implemented yet",
        )
      },
    })
  }
