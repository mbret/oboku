import { useDataSourceHelpers } from "../helpers"
import axios from "axios"
import { useCallback } from "react"
import { dataSourcePlugins } from "@oboku/shared"
import { UseDownloadHook } from "../types"

export const useDownloadBook: UseDownloadHook = () => {
  const { extractIdFromResourceId } = useDataSourceHelpers(dataSourcePlugins[`URI`]?.uniqueResourceIdentifier || ``)

  return useCallback(async (link, options) => {
    const downloadLink = extractIdFromResourceId(link.resourceId)
    const filename = downloadLink.substring(downloadLink.lastIndexOf('/') + 1) || 'unknown'

    const mediaResponse = await axios.get<Blob>(downloadLink, {
      responseType: 'blob',
      onDownloadProgress: (event: ProgressEvent) => {
        const currentTarget = {
          responseHeaders: {
            'Content-Length': '1'
          },
          ...event?.currentTarget
        }
        const total = parseFloat(currentTarget.responseHeaders['Content-Length'])
        options?.onDownloadProgress(event.loaded / total)
      }
    })

    return { data: mediaResponse.data, name: filename }
  }, [extractIdFromResourceId])
}