import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useQueryClient } from "@tanstack/react-query"
import { memo, useCallback, useEffect, useState } from "react"
import { firstValueFrom } from "rxjs"
import { isPluginType } from "../../integrations/plugins/configure"
import { PluginDownloadBook } from "../../integrations/plugins/PluginDownloadBook"
import type { DownloadBookResult } from "../../integrations/plugins/types"
import { CancelError, ERROR_NO_LINK_MESSAGE } from "../../errors/errors.shared"
import { getLatestDatabase } from "../../rxdb/RxDbProvider"
import { getLinkStateAsync } from "../../links/states"
import { dexieDb } from "../../rxdb/dexie"
import { bytesToMb } from "../../common/utils"
import { Logger } from "../../debug/logger.shared"
import type { DownloadBookVariables } from "../downloadBookMutation"
import { storedDownloadsQueryOptions } from "../useStoredDownloads"

type DownloadLink = NonNullable<Awaited<ReturnType<typeof getLinkStateAsync>>>

export const DownloadFlowRequestItem = memo(function DownloadFlowRequestItem({
  request,
}: {
  request: DownloadBookVariables
}) {
  // React Compiler cannot lower this function yet, so it bails out here.
  // TODO: re-check on a newer React Compiler; drop this opt-out once it compiles.
  "use no memo"

  const queryClient = useQueryClient()
  const [link, setLink] = useState<DownloadLink | null>(null)
  const [isPreparing, setIsPreparing] = useState(!request.file)
  const {
    abortController,
    _id: bookId,
    file,
    links,
    progress,
    settlement,
  } = request

  const reportProgress = useCallback(
    function reportProgress(ratio: number) {
      progress.update(Math.round(ratio * 100))
    },
    [progress],
  )

  const persistDownloadResult = useCallback(
    async function persistDownloadResult(result: DownloadBookResult) {
      const data = result.data
      const filename = result.fileName.trim()

      if (!filename) {
        throw new Error("Downloaded file is missing a filename.")
      }

      const cachedData =
        data instanceof File
          ? data
          : new File([data], filename, { type: data.type })

      Logger.log(
        `Saving ${bookId} into storage for a size of ${bytesToMb(data.size)} mb`,
      )

      await dexieDb.downloads.add({
        id: bookId,
        data: cachedData,
        filename,
      })

      await queryClient.refetchQueries({
        queryKey: storedDownloadsQueryOptions.queryKey,
      })
    },
    [bookId, queryClient],
  )

  const onResolve = useCallback(
    function onResolve(result: DownloadBookResult) {
      persistDownloadResult(result).then(settlement.resolve, settlement.reject)
    },
    [persistDownloadResult, settlement],
  )

  useEffect(
    function cancelOnAbort() {
      function rejectAsCancelled() {
        settlement.reject(new CancelError())
      }

      abortController.signal.addEventListener("abort", rejectAsCancelled, {
        once: true,
      })

      return function stopListeningToAbort() {
        abortController.signal.removeEventListener("abort", rejectAsCancelled)
      }
    },
    [abortController, settlement],
  )

  useEffect(
    function prepareRemoteDownload() {
      ;(async function startDownload() {
        if (file) {
          await persistDownloadResult({
            data: file,
            fileName: file.name,
          }).then(settlement.resolve, settlement.reject)

          return
        }

        try {
          const database = await firstValueFrom(getLatestDatabase())
          const resolvedLink = await getLinkStateAsync({
            linkId: links[0] || "",
            db: database,
          })

          if (!resolvedLink) {
            throw new ObokuSharedError(
              ObokuErrorCode.ERROR_NO_LINK,
              new Error(ERROR_NO_LINK_MESSAGE),
            )
          }

          const fileExist = await dexieDb.downloads.get({
            id: bookId,
          })

          if (fileExist) {
            settlement.resolve()

            return
          }

          if (!isPluginType(resolvedLink.type)) {
            throw new Error(`Unsupported link type: ${resolvedLink.type}`)
          }

          setLink(resolvedLink)
          setIsPreparing(false)
        } catch (error) {
          settlement.reject(error)
        }
      })()
    },
    [bookId, file, links, persistDownloadResult, settlement],
  )

  if (file || isPreparing || !link) {
    return null
  }

  const downloadProps = {
    onDownloadProgress: reportProgress,
    onError: settlement.reject,
    onResolve,
    signal: abortController.signal,
  }

  return <PluginDownloadBook {...downloadProps} link={link} />
})
