import axios from "axios"
import { useCallback } from "react"
import { PromiseReturnType } from "../../types"
import { ObokuPlugin } from "@oboku/plugin-front"
import { extractIdFromResourceId, useGetLazySignedGapi } from "./helpers"
import { isDriveResponseError } from "./types"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useCallback(
    async (link, options) => {
      try {
        const { gapi } = (await getLazySignedGapi()) || {}

        if (gapi) {
          const fileId = extractIdFromResourceId(link.resourceId)

          let info: PromiseReturnType<typeof gapi.client.drive.files.get>

          try {
            info = await gapi.client.drive.files.get({
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
              onDownloadProgress: (event: ProgressEvent) => {
                const totalSize = parseInt(info.result.size || "1") || 1
                options?.onDownloadProgress(event.loaded / totalSize)
              }
            }
          )

          return { data: mediaResponse.data, name: info.result.name || "" }
        }

        throw new Error("Unknown error")
      } catch (e) {
        if ((e as any)?.error === "popup_blocked_by_browser") {
          return { isError: true, reason: "popupBlocked" } as {
            isError: true
            reason: "popupBlocked"
          }
        }
        throw e
      }
    },
    [getLazySignedGapi]
  )
}
