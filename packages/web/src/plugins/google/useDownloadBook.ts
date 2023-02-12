import axios from "axios"
import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { extractIdFromResourceId } from "./lib/helpers"
import { isDriveResponseError } from "./lib/types"
import { useAccessToken } from "./lib/useAccessToken"
import { useGoogle } from "./lib/useGsiClient"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const { lazyGapi } = useGoogle()

  return useCallback(
    async (link, options) => {
      await requestToken({
        scope: ["https://www.googleapis.com/auth/drive.readonly"]
      })

      const api = await lazyGapi

      const fileId = extractIdFromResourceId(link.resourceId)

      let info: gapi.client.Response<gapi.client.drive.File>

      try {
        info = await api.client.drive.files.get({
          fileId,
          fields: "name,size"
        })
      } catch (e) {
        if (isDriveResponseError(e)) {
          if (e.status === 404) {
            return {
              isError: true,
              reason: `notFound`,
              error: e
            }
          }
        }
        throw e
      }

      const mediaResponse = await axios.get<Blob>(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${gapi.auth.getToken().access_token}`
          },
          responseType: "blob",
          onDownloadProgress: (event) => {
            const totalSize = parseInt(info.result.size || "1") || 1
            options?.onDownloadProgress(event.loaded / totalSize)
          }
        }
      )

      return { data: mediaResponse.data, name: info.result.name || "" }
    },
    [lazyGapi, requestToken]
  )
}
