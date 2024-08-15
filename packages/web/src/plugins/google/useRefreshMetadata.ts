import { useCallback } from "react"
import { useAccessToken } from "./lib/useAccessToken"
import { ObokuPlugin } from "../types"
import { firstValueFrom } from "rxjs"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return useCallback(async () => {
    const token = await firstValueFrom(
      requestToken({
        scope: ["https://www.googleapis.com/auth/drive.readonly"]
      })
    )

    return { data: token }
  }, [requestToken])
}
