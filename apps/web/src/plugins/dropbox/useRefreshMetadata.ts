import { authUser } from "./lib/auth"
import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  return useMutation({
    mutationFn: async () => {
      const auth = await authUser({ requestPopup })

      return { data: auth }
    },
  })
}
