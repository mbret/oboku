import { DownloadState, booksDownloadStateSignal } from "./states"
import { Report } from "../debug/report.shared"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { BookFile } from "./types"
import { getLinkStateAsync } from "../links/states"
import { bytesToMb } from "../common/utils"
import { createCbzFromReadableStream } from "./createCbzFromReadableStream"
import { usePluginDownloadBook } from "../plugins/usePluginDownloadBook"
import { plugin as pluginLocalFile } from "../plugins/local"
import { isPluginError } from "../plugins/types"
import { BookQueryResult } from "../books/states"
import { createDialog } from "../common/dialogs/createDialog"
import {
  animationFrameScheduler,
  catchError,
  combineLatest,
  defaultIfEmpty,
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
  throttleTime
} from "rxjs"
import { useMutation } from "reactjrx"
import { CancelError } from "../errors/errors.shared"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { dexieDb } from "../rxdb/dexie"

class NoLinkFound extends Error {}

const setDownloadData = (
  bookId: string,
  data: ReturnType<typeof booksDownloadStateSignal.getValue>[number]
) => {
  booksDownloadStateSignal.setValue((prev) => ({
    ...prev,
    [bookId]: {
      ...prev[bookId],
      ...data
    }
  }))
}

export const useDownloadBook = () => {
  const { downloadPluginBook } = usePluginDownloadBook()

  return useMutation({
    mutationFn: ({
      _id: bookId,
      links,
      localFile
    }: Pick<BookQueryResult, `_id` | `links`> & {
      localFile?: File
    }) => {
      const progressSubject = new Subject<number>()

      const updateProgress$ = progressSubject.pipe(
        throttleTime(500, animationFrameScheduler, {
          leading: true,
          trailing: true
        }),
        tap((progress) => {
          setDownloadData(bookId, {
            downloadProgress: progress
          })
        }),
        ignoreElements()
      )

      setDownloadData(bookId, {
        downloadProgress: 0,
        downloadState: DownloadState.Downloading
      })

      return latestDatabase$.pipe(
        first(),
        switchMap((database) => {
          const link$ = from(
            getLinkStateAsync({
              linkId: links[0] || ``,
              db: database
            })
          ).pipe(
            map((link) => {
              if (!link) {
                createDialog({
                  autoStart: true,
                  title: "No link!",
                  content:
                    "Your book does not have a valid link to download the file. Please add one before proceeding"
                })

                throw new NoLinkFound()
              }

              return link
            })
          )

          const fileExist$ = from(
            dexieDb.downloads.get({
              id: bookId
            })
          )

          return merge(
            updateProgress$,
            combineLatest([link$, fileExist$]).pipe(
              switchMap(([link, fileExist]) => {
                // for some reason if the file exist we do not download it again
                if (fileExist) {
                  setDownloadData(bookId, {
                    downloadProgress: 100,
                    downloadState: DownloadState.Downloaded
                  })

                  return EMPTY
                }

                if (link.type === pluginLocalFile.type && !localFile) {
                  Report.error(
                    `Something is wrong as you are trying to download local book without passing the local file. Either you forgot to download properly the book back when the user added it or there is a invalid state and the book should open instead.`
                  )

                  createDialog({
                    autoStart: true,
                    title: "Impossible to download!",
                    content:
                      "This book does not appear to be located on this device and cannot be downloaded here!"
                  })

                  throw new CancelError()
                }

                const onDownloadProgress = (progress: number) => {
                  progressSubject.next(Math.round(progress * 100))
                }

                const pluginDownloadResponse$ = from(
                  downloadPluginBook({
                    link,
                    onDownloadProgress
                  })
                )

                const downloadFile$ = pluginDownloadResponse$.pipe(
                  switchMap((downloadResponse) => {
                    if (
                      "isError" in downloadResponse &&
                      downloadResponse.reason === "notFound"
                    ) {
                      // @todo shorten this description and redirect to the documentation
                      createDialog({
                        autoStart: true,
                        preset: `UNKNOWN_ERROR`,
                        title: `Unable to download`,
                        content: `
                            oboku could not find the book from the linked data source. 
                            This can happens if you removed the book from the data source or if you replaced it with another file.
                            Make sure the book is on your data source and try to fix the link for this book in the details screen to target the file. 
                            Attention, if you add the book on your data source and synchronize again, oboku will duplicate the book.
                          `
                      })

                      throw new CancelError()
                    }

                    if ("isError" in downloadResponse) {
                      throw (
                        downloadResponse.error ||
                        new Error(downloadResponse.reason)
                      )
                    }

                    const data$ =
                      downloadResponse.data instanceof Blob
                        ? of(downloadResponse.data)
                        : // when the plugin returns a stream we will create the archive ourselves based on the nature
                          // of the stream.
                          from(
                            createCbzFromReadableStream(downloadResponse.data, {
                              onData: ({ progress }) =>
                                onDownloadProgress(progress)
                            })
                          )

                    return data$.pipe(
                      map((data) => ({
                        data,
                        name:
                          downloadResponse.name ??
                          generateFilenameFromBlob(data, bookId)
                      }))
                    )
                  })
                )

                const file$ = localFile
                  ? of({ data: localFile, name: localFile.name })
                  : downloadFile$

                return file$.pipe(
                  switchMap(({ data, name }) => {
                    Report.log(
                      `Saving ${bookId} into storage for a size of ${bytesToMb(
                        data.size
                      )} mb`
                    )

                    return from(
                      dexieDb.downloads.add({
                        id: bookId,
                        data,
                        name
                      })
                    )
                  }),
                  tap(() => {
                    setDownloadData(bookId, {
                      downloadProgress: 100,
                      downloadState: DownloadState.Downloaded
                    })
                  })
                )
              }),
              finalize(() => {
                progressSubject.complete()
              })
            )
          )
        }),
        catchError((error) => {
          setDownloadData(bookId, {
            downloadState: DownloadState.None
          })

          if (error instanceof NoLinkFound) return EMPTY
          if (isPluginError(error) && error.code === "cancelled") return EMPTY

          throw error
        }),
        defaultIfEmpty(null)
      )
    }
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
