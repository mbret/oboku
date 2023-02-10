import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { authUser } from "./lib/auth"

export const useSynchronize: ObokuPlugin[`useSynchronize`] = ({
  requestPopup
}) => {
  return useCallback(async () => {
    const auth = await authUser({ requestPopup })

    return { data: auth }
  }, [])
}
