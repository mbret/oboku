import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { Logger } from "../debug/logger.shared"
import { downloadsBroadcast } from "./downloadsBroadcast"
import { reconcileDownloadStateFromStorage } from "./reconcileDownloadStateFromStorage"
import { downloadedFilesQueryOptions } from "./useDownloadedFilesInfo"

export const SyncDownloadsAcrossTabs = memo(function SyncDownloadsAcrossTabs() {
  const queryClient = useQueryClient()

  useEffect(
    function mirrorDownloadChangesFromOtherTabs() {
      return downloadsBroadcast.subscribe(
        function onDownloadsChangedInOtherTab() {
          reconcileDownloadStateFromStorage().catch(Logger.error)

          void queryClient.invalidateQueries({
            queryKey: downloadedFilesQueryOptions.queryKey,
          })
        },
      )
    },
    [queryClient],
  )

  return null
})
