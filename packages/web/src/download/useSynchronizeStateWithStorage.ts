import { useEffect } from "react";
import localforage from 'localforage'
import { DOWNLOAD_PREFIX } from "../constants";
import { useRecoilCallback } from "recoil";
import { normalizedBookDownloadsState, DownloadState } from "./states";

const getKeys = async () => (await localforage.keys())
  .filter(key => key.startsWith(DOWNLOAD_PREFIX))
  .map(key => key.replace(`${DOWNLOAD_PREFIX}-`, ''))

export const useSynchronizeStateWithStorage = () => {

  const restoreStateForFinishedDownloadIfNeeded = useRecoilCallback(({ snapshot, set }) => async () => {
    const keys = await getKeys()

    await Promise.all(
      keys
        .map(async function restoreStateForFinishedDownloadIfNeeded(bookId) {
          const state = await snapshot.getPromise(normalizedBookDownloadsState)
          const readingState = state[bookId]
          if (readingState?.downloadState !== DownloadState.Downloaded) {
            const item = await localforage.getItem<Blob>(`${DOWNLOAD_PREFIX}-${bookId}`)
            if (item) {
              set(normalizedBookDownloadsState, old => ({
                ...old,
                [bookId]: {
                  downloadProgress: 100,
                  downloadState: DownloadState.Downloaded,
                  size: item?.size,
                }
              }))
            }
          }
        }),
    )
  }, [])

  const removeBooksThatAreNotPresentPhysicallyAnymore = useRecoilCallback(({ snapshot, set }) => async () => {
    const keys = await getKeys()
    const state = await snapshot.getPromise(normalizedBookDownloadsState)
    const bookInProgressOrDownloadedButNotPresentAnymore = Object
      .keys(state)
      .filter(id => !keys.includes(id) && state[id]?.downloadState !== DownloadState.None)

    if (bookInProgressOrDownloadedButNotPresentAnymore.length > 0) {
      set(normalizedBookDownloadsState,
        old => Object
          .keys(old)
          .filter(id => !bookInProgressOrDownloadedButNotPresentAnymore.includes(id))
          .reduce((newLegitState, currentLegitId) => ({ ...newLegitState, [currentLegitId]: old[currentLegitId] }), {})
      )
    }
  }, [])

  useEffect(() => {
    removeBooksThatAreNotPresentPhysicallyAnymore()
    restoreStateForFinishedDownloadIfNeeded()
  }, [removeBooksThatAreNotPresentPhysicallyAnymore, restoreStateForFinishedDownloadIfNeeded])
}