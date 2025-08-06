import { authUser } from "./lib/auth"
import type { UseSynchronizeHook } from "../types"
import { useMutation } from "@tanstack/react-query"

export const useSynchronize: UseSynchronizeHook<"dropbox"> = ({
  requestPopup,
}) => {
  return useMutation({
    mutationFn: async () => {
      const auth = await authUser({ requestPopup })

      return {
        data: {
          ...auth,
        },
      }
    },
  })
}
