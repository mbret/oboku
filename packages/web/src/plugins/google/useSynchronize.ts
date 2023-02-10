import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { useAccessToken } from "./lib/useAccessToken"

export const useSynchronize: ObokuPlugin[`useSynchronize`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return useCallback(async () => {
    const token = await requestToken({
      scope: ["https://www.googleapis.com/auth/drive.readonly"]
    })

    return { data: token }
  }, [requestToken])
}
