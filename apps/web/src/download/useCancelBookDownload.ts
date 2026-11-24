import { useQueryClient } from "@tanstack/react-query"
import { cancelPluginDownloadFlow } from "./flow/PluginDownloadFlowHost"

export const useCancelBookDownload = () => {
  const queryClient = useQueryClient()

  return function cancelBookDownload(bookId: string) {
    cancelPluginDownloadFlow({ bookId, queryClient })
  }
}
