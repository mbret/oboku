import { useCallback } from "react"
import { cancelPluginDownloadFlow } from "./flow/PluginDownloadFlowHost"

export const useCancelBookDownload = () => {
  return useCallback((bookId: string) => {
    cancelPluginDownloadFlow(bookId)
  }, [])
}
