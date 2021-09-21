import localforage from 'localforage';
import { useSetRecoilState } from 'recoil';
import { DOWNLOAD_PREFIX } from '../constants.shared';
import { Report } from '../debug/report';
import { DownloadState, normalizedBookDownloadsState } from './states';

export const useRemoveDownloadFile = () => {
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)

  return async (bookId: string) => {
    try {
      await localforage.removeItem(`${DOWNLOAD_PREFIX}-${bookId}`)
      setBookDownloadsState(prev => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          downloadState: DownloadState.None,
        }
      }))
    } catch (e) {
      Report.error(e)
    }
  }
}