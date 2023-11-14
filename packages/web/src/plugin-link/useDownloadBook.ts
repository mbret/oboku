import axios from "axios"
import { useCallback } from "react"
import { extractIdFromResourceId, ObokuPlugin } from "@oboku/plugin-front"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  return useCallback(
    async (link, options) => {
      const downloadLink = extractIdFromResourceId(
        UNIQUE_RESOURCE_IDENTIFIER,
        link.resourceId
      )
      const filename =
        downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"

      const mediaResponse = await axios.get<Blob>(downloadLink, {
        responseType: "blob",
        onDownloadProgress: (event) => {
          options?.onDownloadProgress(event.loaded / (event.total ?? 1))
        }
      })

      return { data: mediaResponse.data, name: filename }
    },
    [extractIdFromResourceId]
  )
}
