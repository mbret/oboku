import { useMutation } from "@tanstack/react-query"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import type { ObokuPlugin } from "../types"

export const useSynchronize: ObokuPlugin<"one-drive">["useSynchronize"] =
  () => {
    return useMutation({
      mutationFn: async () => {
        throw new UnsupportedMethodError(
          "OneDrive synchronization is not implemented yet",
        )
      },
    })
  }
