import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { firstValueFrom } from "rxjs"
import { pluginsByType } from "../../plugins/configure"
import type { DownloadBookResult } from "../../plugins/types"
import { CancelError, ERROR_NO_LINK_MESSAGE } from "../../errors/errors.shared"
import { latestDatabase$ } from "../../rxdb/RxDbProvider"
import { getLinkStateAsync } from "../../links/states"
import { dexieDb } from "../../rxdb/dexie"
import { bytesToMb } from "../../common/utils"
import { createCbzFromReadableStream } from "../createCbzFromReadableStream"
import { DownloadState, booksDownloadStateSignal } from "../states"
import { Logger } from "../../debug/logger.shared"
import { notifyError } from "../../notifications/toasts"
import type { DownloadFlowRequest } from "./types"

type DownloadLink = NonNullable<Awaited<ReturnType<typeof getLinkStateAsync>>>

const toError = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error : new Error(fallbackMessage)

const setDownloadData = (
  bookId: string,
  data: ReturnType<typeof booksDownloadStateSignal.getValue>[number],
) => {
  booksDownloadStateSignal.update((prev) => ({
    ...prev,
    [bookId]: {
      ...prev[bookId],
      ...data,
    },
  }))
}

export const DownloadFlowRequestItem = memo(
  ({
    onSettled,
    request,
  }: {
    onSettled: () => void
    request: DownloadFlowRequest
  }) => {
    const [link, setLink] = useState<DownloadLink | null>(null)
    const [isPreparing, setIsPreparing] = useState(!request.file)
    const { abortController, bookId, file, links, reject, resolve } = request
    const isSettledRef = useRef(false)

    const setProgress = useCallback(
      (progress: number) => {
        setDownloadData(bookId, {
          downloadProgress: Math.round(progress * 100),
        })
      },
      [bookId],
    )

    const settle = useCallback(
      ({ error, success = false }: { error?: unknown; success?: boolean }) => {
        if (isSettledRef.current) {
          return
        }

        isSettledRef.current = true
        onSettled()

        if (success) {
          setDownloadData(bookId, {
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
          })
          resolve()

          return
        }

        setDownloadData(bookId, {
          downloadState: DownloadState.None,
        })

        if (error instanceof CancelError) {
          reject(error)

          return
        }

        if (error) {
          notifyError(error)
        }

        reject(toError(error, "Download failed"))
      },
      [bookId, onSettled, reject, resolve],
    )

    const persistDownloadResult = useCallback(
      async (result: DownloadBookResult) => {
        const sourceData = result.data
        const filename = result.fileName.trim()

        if (!filename) {
          throw new Error("Downloaded file is missing a filename.")
        }

        const data =
          sourceData instanceof Blob
            ? sourceData
            : await createCbzFromReadableStream(sourceData, {
                onData: ({ progress }) => setProgress(progress),
              })

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
      },
      [bookId, setProgress],
    )

    const onResolve = useCallback(
      (result: DownloadBookResult) => {
        void persistDownloadResult(result)
          .then(() => {
            settle({ success: true })
          })
          .catch((error) => {
            settle({
              error: toError(error, "Unable to persist downloaded file."),
            })
          })
      },
      [persistDownloadResult, settle],
    )

    const onError = useCallback(
      (error: unknown) => {
        settle({ error })
      },
      [settle],
    )

    // User cancel: signal abort is handled here; provider also receives signal and may call onError(CancelError); settle guard makes duplicate no-op.
    useEffect(() => {
      const handleAbort = () => {
        onError(new CancelError())
      }

      abortController.signal.addEventListener("abort", handleAbort, {
        once: true,
      })

      return () => {
        abortController.signal.removeEventListener("abort", handleAbort)
      }
    }, [abortController, onError])

    useEffect(
      function prepareRemoteDownload() {
        ;(async () => {
          setDownloadData(bookId, {
            downloadProgress: 0,
            downloadState: DownloadState.Downloading,
          })

          if (file) {
            try {
              await persistDownloadResult({
                data: file,
                fileName: file.name,
              })
              settle({ success: true })
            } catch (error) {
              onError(toError(error, "Unable to persist downloaded file."))
            }

            return
          }

          try {
            const database = await firstValueFrom(latestDatabase$)
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
              settle({ success: true })

              return
            }

            setLink(resolvedLink)
            setIsPreparing(false)
          } catch (error) {
            onError(toError(error, "Unable to prepare the download."))
          }
        })()
      },
      [bookId, file, links, onError, persistDownloadResult, settle],
    )

    if (file || isPreparing || !link) {
      return null
    }

    const downloadProps = {
      onDownloadProgress: setProgress,
      onError,
      onResolve,
      signal: abortController.signal,
    }

    switch (link.type) {
      case "DRIVE": {
        const { DownloadBookComponent } = pluginsByType.DRIVE
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "one-drive": {
        const { DownloadBookComponent } = pluginsByType["one-drive"]
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "URI": {
        const { DownloadBookComponent } = pluginsByType.URI
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "dropbox": {
        const { DownloadBookComponent } = pluginsByType.dropbox
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "file": {
        const { DownloadBookComponent } = pluginsByType.file
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "server": {
        const { DownloadBookComponent } = pluginsByType.server
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "synology-drive": {
        const { DownloadBookComponent } = pluginsByType["synology-drive"]
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      case "webdav": {
        const { DownloadBookComponent } = pluginsByType.webdav
        return <DownloadBookComponent {...downloadProps} link={link} />
      }
      default: {
        const _exhaustive: never = link
        onError(
          new Error(
            `Unsupported link type: ${(_exhaustive as DownloadLink).type}`,
          ),
        )
        return null
      }
    }
  },
)
