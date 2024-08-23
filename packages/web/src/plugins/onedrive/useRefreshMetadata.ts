import { useCallback } from "react"
import { authUser } from "./lib/auth"
import { ObokuPlugin } from "../types"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup
}) => {
  return useCallback(async (link) => {
    const auth = await authUser({ requestPopup })

    return { data: auth }
  }, [])
}
