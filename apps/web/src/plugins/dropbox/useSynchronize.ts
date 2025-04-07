import { useCallback } from "react"
import { authUser } from "./lib/auth"
import type { UseSynchronizeHook } from "../types"

export const useSynchronize: UseSynchronizeHook<"dropbox"> = ({
  requestPopup,
}) => {
  return useCallback(async () => {
    const auth = await authUser({ requestPopup })

    return {
      data: {
        ...auth,
      },
    }
  }, [requestPopup])
}
