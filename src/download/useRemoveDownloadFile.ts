import localforage from 'localforage';
import { useSetRecoilState } from 'recoil';
import { DownloadState, normalizedBookDownloadsState } from './states';

export const useRemoveDownloadFile = () => {
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)

  return async (bookId: string) => {
    try {
      await localforage.removeItem(`book-download-${bookId}`)
      setBookDownloadsState(prev => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          downloadState: DownloadState.None,
        }
      }))
    } catch (e) {
      console.error(e)
    }
  }
}