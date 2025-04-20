import { DownloadState, booksDownloadStateSignal } from "./states"
import { Logger } from "../debug/logger.shared"
import { getLinkStateAsync } from "../links/states"
import { bytesToMb } from "../common/utils"
import { createCbzFromReadableStream } from "./createCbzFromReadableStream"
import { usePluginDownloadBook } from "../plugins/usePluginDownloadBook"
import type { BookQueryResult } from "../books/states"
import { createDialog } from "../common/dialogs/createDialog"
import {
  animationFrameScheduler,
  catchError,
  combineLatest,
  defaultIfEmpty,
  defer,
  EMPTY,
  finalize,
  first,
  from,
  ignoreElements,
  map,
  merge,
  of,
  Subject,
  switchMap,
  tap,
  throttleTime,
} from "rxjs"
import { CancelError, isPluginError } from "../errors/errors.shared"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { dexieDb } from "../rxdb/dexie"
import { useMutation$ } from "reactjrx"
import { useNotifications } from "../notifications/useNofitications"

class NoLinkFound extends Error {}

const setDownloadData = (
  bookId: string,
  data: ReturnType<typeof booksDownloadStateSignal.getValue>[number],
) => {
  booksDownloadStateSignal.setValue((prev) => ({
    ...prev,
    [bookId]: {
      ...prev[bookId],
      ...data,
    },
  }))
}

export const useDownloadBook = () => {
  const { downloadPluginBook } = usePluginDownloadBook()
  const { notifyError } = useNotifications()

  return useMutation$({
    mutationFn: ({
      _id: bookId,
      links,
      file,
    }: Pick<BookQueryResult, `_id` | `links`> & {
      file?: File
    }) => {
      const progressSubject = new Subject<number>()

      const updateProgress$ = progressSubject.pipe(
        throttleTime(500, animationFrameScheduler, {
          leading: true,
          trailing: true,
        }),
        tap((progress) => {
          setDownloadData(bookId, {
            downloadProgress: progress,
          })
        }),
        ignoreElements(),
      )

      setDownloadData(bookId, {
        downloadProgress: 0,
        downloadState: DownloadState.Downloading,
      })

      return latestDatabase$.pipe(
        first(),
        switchMap((database) => {
          const link$ = from(
            getLinkStateAsync({
              linkId: links[0] || ``,
              db: database,
            }),
          ).pipe(
            map((link) => {
              if (!link) {
                createDialog({
                  autoStart: true,
                  title: "No link!",
                  content:
                    "Your book does not have a valid link to download the file. Please add one before proceeding",
                })

                throw new NoLinkFound()
              }

              return link
            }),
          )

          const fileExist$ = from(
            dexieDb.downloads.get({
              id: bookId,
            }),
          )

          return merge(
            updateProgress$,
            combineLatest([link$, fileExist$]).pipe(
              switchMap(([link, fileExist]) => {
                // for some reason if the file exist we do not download it again
                if (fileExist) {
                  setDownloadData(bookId, {
                    downloadProgress: 100,
                    downloadState: DownloadState.Downloaded,
                  })

                  return EMPTY
                }

                const onDownloadProgress = (progress: number) => {
                  progressSubject.next(Math.round(progress * 100))
                }

                const downloadFile$ = defer(() =>
                  downloadPluginBook({
                    link,
                    onDownloadProgress,
                  }).pipe(
                    switchMap((downloadResponse) => {
                      const data$ =
                        downloadResponse.data instanceof Blob
                          ? of(downloadResponse.data)
                          : // when the plugin returns a stream we will create the archive ourselves based on the nature
                            // of the stream.
                            from(
                              createCbzFromReadableStream(
                                downloadResponse.data,
                                {
                                  onData: ({ progress }) =>
                                    onDownloadProgress(progress),
                                },
                              ),
                            )

                      return data$.pipe(
                        map((data) => ({
                          data,
                          name:
                            downloadResponse.name ??
                            generateFilenameFromBlob(data, bookId),
                        })),
                      )
                    }),
                  ),
                )

                const file$ = file
                  ? of({ data: file, name: file.name })
                  : downloadFile$

                return file$.pipe(
                  switchMap(({ data, name }) => {
                    Logger.log(
                      `Saving ${bookId} into storage for a size of ${bytesToMb(
                        data.size,
                      )} mb`,
                    )

                    return from(
                      dexieDb.downloads.add({
                        id: bookId,
                        data,
                        name,
                      }),
                    )
                  }),
                  tap(() => {
                    setDownloadData(bookId, {
                      downloadProgress: 100,
                      downloadState: DownloadState.Downloaded,
                    })
                  }),
                )
              }),
              finalize(() => {
                progressSubject.complete()
              }),
            ),
          )
        }),
        catchError((error) => {
          setDownloadData(bookId, {
            downloadState: DownloadState.None,
          })

          if (
            error instanceof NoLinkFound ||
            (isPluginError(error) && error.code === "cancelled") ||
            error instanceof CancelError
          )
            return EMPTY

          notifyError(error)

          if (isPluginError(error)) {
            if (error.severity === "user") return EMPTY
          }

          throw error
        }),
        defaultIfEmpty(null),
      )
    },
  })
}

const generateFilenameFromBlob = (data: Blob, bookId: string) => {
  switch (data.type) {
    case `application/x-cbz`:
      return `${bookId}.cbz`
    default:
      return bookId
  }
}
