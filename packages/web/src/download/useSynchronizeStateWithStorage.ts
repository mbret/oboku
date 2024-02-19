import { useCallback, useEffect } from "react"
import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { DownloadState, normalizedBookDownloadsStateSignal } from "./states"

const getKeys = async () =>
  (await localforage.keys())
    .filter((key) => key.startsWith(DOWNLOAD_PREFIX))
    .map((key) => key.replace(`${DOWNLOAD_PREFIX}-`, ""))

export const useSynchronizeStateWithStorageEffect = () => {
  const restoreStateForFinishedDownloadIfNeeded = useCallback(async () => {
    const state = normalizedBookDownloadsStateSignal.getValue()
    const keys = await getKeys()

    await Promise.all(
      keys.map(async function restoreStateForFinishedDownloadIfNeeded(bookId) {
        const readingState = state[bookId]
        if (readingState?.downloadState !== DownloadState.Downloaded) {
          const item = await localforage.getItem<Blob>(
            `${DOWNLOAD_PREFIX}-${bookId}`
          )
          if (item) {
            normalizedBookDownloadsStateSignal.setValue((old) => ({
              ...old,
              [bookId]: {
                downloadProgress: 100,
                downloadState: DownloadState.Downloaded,
                size: item?.size
              }
            }))
          }
        }
      })
    )
  }, [])

  const removeBooksThatAreNotPresentPhysicallyAnymore =
    useCallback(async () => {
      const state = normalizedBookDownloadsStateSignal.getValue()
      const keys = await getKeys()
      const bookInProgressOrDownloadedButNotPresentAnymore = Object.keys(
        state
      ).filter(
        (id) =>
          !keys.includes(id) && state[id]?.downloadState !== DownloadState.None
      )

      if (bookInProgressOrDownloadedButNotPresentAnymore.length > 0) {
        normalizedBookDownloadsStateSignal.setValue((old) =>
          Object.keys(old)
            .filter(
              (id) =>
                !bookInProgressOrDownloadedButNotPresentAnymore.includes(id)
            )
            .reduce(
              (newLegitState, currentLegitId) => ({
                ...newLegitState,
                [currentLegitId]: old[currentLegitId]
              }),
              {}
            )
        )
      }
    }, [])

  useEffect(() => {
    removeBooksThatAreNotPresentPhysicallyAnymore()
    restoreStateForFinishedDownloadIfNeeded()
  }, [
    removeBooksThatAreNotPresentPhysicallyAnymore,
    restoreStateForFinishedDownloadIfNeeded
  ])
}
