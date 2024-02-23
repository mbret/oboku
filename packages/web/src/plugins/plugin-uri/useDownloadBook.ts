import { useCallback } from "react"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { ObokuPlugin, extractIdFromResourceId } from "../plugin-front"
import { httpClient } from "../../http/httpClient"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  return useCallback(async (link, options) => {
    const downloadLink = extractIdFromResourceId(
      UNIQUE_RESOURCE_IDENTIFIER,
      link.resourceId
    )
    const filename =
      downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"

    const mediaResponse = await httpClient.download<Blob>({
      responseType: "blob",
      url: downloadLink,
      onDownloadProgress: (event) => {
        options?.onDownloadProgress(event.loaded / (event.total ?? 1))
      }
    })

    return { data: mediaResponse.data, name: filename }
  }, [])
}
