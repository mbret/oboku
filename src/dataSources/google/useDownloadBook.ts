import axios from "axios"
import { useCallback } from "react"
import { UseDownloadHook } from "../types"
import { extractIdFromResourceId, useGetLazySignedGapi } from "./helpers"

export const useDownloadBook: UseDownloadHook = () => {
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useCallback(async (link, options) => {
    const { gapi } = await getLazySignedGapi() || {}

    if (gapi) {
      const fileId = extractIdFromResourceId(link.resourceId)

      const info = await gapi.client.drive.files.get({
        fileId,
        fields: 'name,size'
      })

      const mediaResponse = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`
        },
        responseType: 'blob',
        onDownloadProgress: (event: ProgressEvent) => {
          options?.onDownloadProgress(event, parseInt(info.result.size || '1') || 1)
        }
      })

      return { data: mediaResponse.data, name: info.result.name || '' }
    }

    throw new Error('Unknown error')
  }, [getLazySignedGapi])
}