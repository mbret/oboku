import localforage from "localforage"
import { useCallback } from "react"
import throttle from "lodash.throttle"
import { UnwrapRecoilValue, useRecoilCallback, useSetRecoilState } from "recoil"
import { DownloadState, normalizedBookDownloadsState } from "./states"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { BookFile } from "./types"
import { BookDocType } from "@oboku/shared"
import { linkState } from "../links/states"
import { useDialogManager } from "../dialog"
import { bytesToMb } from "../common/utils"
import { createCbzFromReadableStream } from "./createCbzFromReadableStream"
import { useDownloadBookFromDataSource } from "../plugins/useDownloadBookFromDataSource"
import { isPluginError } from "../plugins/plugin-front"

export const useDownloadBook = () => {
  const downloadBook = useDownloadBookFromDataSource()
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)
  const { db: database } = useDatabase()
  const dialog = useDialogManager()

  const setDownloadData = useCallback(
    (
      bookId: string,
      data: UnwrapRecoilValue<typeof normalizedBookDownloadsState>[number]
    ) => {
      setBookDownloadsState((prev) => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          ...data
        }
      }))
    },
    [setBookDownloadsState]
  )

  return useRecoilCallback(
    ({ snapshot }) =>
      async (
        { _id: bookId, links }: Pick<BookDocType, `_id` | `links`>,
        localFile?: File
      ) => {
        const throttleSetProgress = throttle((progress: number) => {
          setDownloadData(bookId, {
            downloadProgress: progress
          })
        }, 500)

        try {
          setDownloadData(bookId, {
            downloadProgress: 0,
            downloadState: DownloadState.Downloading
          })

          const firstLink = await snapshot.getPromise(linkState(links[0] || ``))

          if (!firstLink) {
            // @todo add dialog to tell book is broken
            throw new Error("invalid link")
          }

          // for some reason if the file exist we do not download it again
          if (
            await localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)
          ) {
            setDownloadData(bookId, {
              downloadProgress: 100,
              downloadState: DownloadState.Downloaded
            })
            return
          }

          if (firstLink.type === `FILE`) {
            if (localFile) {
              await localforage.setItem<BookFile>(
                `${DOWNLOAD_PREFIX}-${bookId}`,
                { data: localFile, name: localFile.name }
              )
            } else {
              Report.error(
                `Something is wrong as you are trying to download local book without passing the local file. Either you forgot to download properly the book back when the user added it or there is a invalid state and the book should open instead.`
              )

              // @todo show a dialog
              throw new Error(`Cannot download local file from another device`)
            }
          } else {
            const onDownloadProgress = (progress: number) => {
              // if ((event.target as XMLHttpRequest).getAllResponseHeaders().indexOf('oboku-content-length')) {
              // const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
              // throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
              throttleSetProgress(Math.round(progress * 100))
              // }
            }

            const downloadResponse = await downloadBook(firstLink, {
              onDownloadProgress
            })

            if (
              "isError" in downloadResponse &&
              downloadResponse.reason === "notFound"
            ) {
              setDownloadData(bookId, {
                downloadState: DownloadState.None
              })
              // @todo shorten this description and redirect to the documentation
              dialog({
                preset: `UNKNOWN_ERROR`,
                title: `Unable to download`,
                content: `
              oboku could not find the book from the linked data source. 
              This can happens if you removed the book from the data source or if you replaced it with another file.
              Make sure the book is on your data source and try to fix the link for this book in the details screen to target the file. 
              Attention, if you add the book on your data source and synchronize again, oboku will duplicate the book.
            `
              })
              return
            }

            if ("isError" in downloadResponse) {
              throw downloadResponse.error || new Error(downloadResponse.reason)
            }

            const data =
              downloadResponse.data instanceof Blob
                ? downloadResponse.data
                : // when the plugin returns a stream we will create the archive ourselves based on the nature
                  // of the stream.
                  await createCbzFromReadableStream(downloadResponse.data, {
                    onData: ({ progress }) => onDownloadProgress(progress)
                  })

            Report.log(
              `Saving ${bookId} into storage for a size of ${bytesToMb(
                data.size
              )} mb`
            )

            await localforage.setItem<BookFile>(
              `${DOWNLOAD_PREFIX}-${bookId}`,
              {
                data,
                name:
                  downloadResponse.name ||
                  generateFilenameFromBlob(data, bookId)
              }
            )
          }

          setDownloadData(bookId, {
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded
          })
        } catch (e) {
          setDownloadData(bookId, {
            downloadState: DownloadState.None
          })

          if (isPluginError(e) && e.code === "cancelled") return

          Report.error(e)
        }
      },
    [setDownloadData, database, downloadBook]
  )
}

const generateFilenameFromBlob = (data: Blob, bookId: string) => {
  switch (data.type) {
    case `application/x-cbz`:
      return `${bookId}.cbz`
    default:
      return bookId
  }
}
