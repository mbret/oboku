import { useCallback } from "react"
import { authUser } from "./lib/auth"
import { ObokuPlugin } from "../types"

export const useSynchronize: ObokuPlugin[`useSynchronize`] = ({
  requestPopup,
}) => {
  return useCallback(async () => {
    const auth = await authUser({ requestPopup })

    return { data: auth }
  }, [requestPopup])
}
