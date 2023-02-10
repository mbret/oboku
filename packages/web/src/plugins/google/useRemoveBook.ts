import { useCallback } from "react"
import { ObokuPlugin, ObokuPluginError } from "@oboku/plugin-front"
import { extractIdFromResourceId } from "./lib/helpers"
import { useAccessToken } from "./lib/useAccessToken"
import { useGoogle } from "./lib/useGsiClient"
import { isPopupClosedError } from "./lib/errors"

export const useRemoveBook: ObokuPlugin[`useRemoveBook`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const { lazyGapi } = useGoogle()

  return useCallback(
    async (link) => {
      try {
        await requestToken({
          scope: [`https://www.googleapis.com/auth/drive`]
        })

        const gapi = await lazyGapi

        const fileId = extractIdFromResourceId(link.resourceId)

        await gapi.client.drive.files.delete({
          fileId
        })

        return { data: {} }
      } catch (e) {
        if (isPopupClosedError(e)) {
          throw new ObokuPluginError({ code: "cancelled" })
        }

        throw e
      }
    },
    [requestToken, lazyGapi]
  )
}
