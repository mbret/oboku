import { UseGetCredentials } from "@oboku/plugin-front"
import { useCallback } from "react"
import { useAccessToken } from "./lib/useAccessToken"

export const useGetCredentials: UseGetCredentials = () => {
  const { requestToken } = useAccessToken()

  return useCallback(async () => {
    try {
      const accessToken = await requestToken({
        scope: [`https://www.googleapis.com/auth/drive.readonly`]
      })

      return { data: accessToken }
    } catch (e) {
      if ((e as any)?.type === "popup_closed") {
        return { isError: true, reason: "cancelled" } as {
          isError: true
          reason: "cancelled"
        }
      }
      if ((e as any)?.type === "popup_closed_by_user") {
        return { isError: true, reason: "cancelled" } as {
          isError: true
          reason: "cancelled"
        }
      }
      if ((e as any)?.error === "popup_blocked_by_browser") {
        return { isError: true, reason: "popupBlocked" } as {
          isError: true
          reason: "popupBlocked"
        }
      }
      throw e
    }
  }, [requestToken])
}
