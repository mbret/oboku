import { cancelPluginDownloadFlow } from "./flow/PluginDownloadFlowHost"

export const useCancelBookDownload = () => {
  return (bookId: string) => {
    cancelPluginDownloadFlow(bookId)
  }
}
