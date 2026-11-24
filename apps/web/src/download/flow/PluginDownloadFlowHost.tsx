import type { QueryClient } from "@tanstack/react-query"
import { memo } from "react"
import {
  findPendingBookDownload,
  usePendingDownloads,
} from "../downloadBookMutation"
import { DownloadFlowRequestItem } from "./DownloadFlowRequestItem"

export const cancelPluginDownloadFlow = ({
  bookId,
  queryClient,
}: {
  bookId: string
  queryClient: QueryClient
}) => {
  findPendingBookDownload(queryClient, bookId)?.abortController.abort()
}

export const PluginDownloadFlowHost = memo(function PluginDownloadFlowHost() {
  const pendingDownloads = usePendingDownloads()

  return pendingDownloads.map(function renderPendingDownload({
    mutationId,
    variables,
  }) {
    return <DownloadFlowRequestItem key={mutationId} request={variables} />
  })
})
