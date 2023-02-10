import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { authUser } from "./lib/auth"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup
}) => {
  return useCallback(async (link) => {
    const auth = await authUser({ requestPopup })

    return { data: auth }
  }, [])
}
