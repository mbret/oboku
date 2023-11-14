import { useCallback } from "react"
import { extractIdFromResourceId } from "./lib/helpers"
import { useAccessToken } from "./lib/useAccessToken"
import { useGoogle } from "./lib/useGsiClient"
import { ObokuPlugin } from "../plugin-front"

export const useRemoveBook: ObokuPlugin[`useRemoveBook`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const { lazyGapi } = useGoogle()

  return useCallback(
    async (link) => {
      await requestToken({
        scope: [`https://www.googleapis.com/auth/drive`]
      })

      const gapi = await lazyGapi

      const fileId = extractIdFromResourceId(link.resourceId)

      await gapi.client.drive.files.delete({
        fileId
      })

      return { data: {} }
    },
    [requestToken, lazyGapi]
  )
}
