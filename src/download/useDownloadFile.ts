import localforage from 'localforage';
import { useCallback } from 'react';
import throttle from 'lodash.throttle';
import { UnwrapRecoilValue, useSetRecoilState } from 'recoil';
import { DownloadState, normalizedBookDownloadsState } from './states';
import { useAxiosClient } from '../axiosClient';

export const useDownloadFile = () => {
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)
  const client = useAxiosClient()

  const setDownloadData = useCallback((bookId: string, data: UnwrapRecoilValue<typeof normalizedBookDownloadsState>[number]) => {
    setBookDownloadsState(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        ...data,
      }
    }))
  }, [setBookDownloadsState])

  return useCallback(async (bookId: string) => {
    const throttleSetProgress = throttle((progress: number) => {
      setDownloadData(bookId, {
        downloadProgress: progress
      })
    }, 500)

    try {
      setDownloadData(bookId, {
        downloadProgress: 0,
          downloadState: DownloadState.Downloading,
      })

      try {
        if (await localforage.getItem(`book-download-${bookId}`)) {
          setDownloadData(bookId, {
            downloadProgress: 100,
              downloadState: DownloadState.Downloaded,
          })
          return
        }
        const response = await client.downloadBook(bookId, {
          onDownloadProgress: (event: ProgressEvent) => {
            if ((event.target as XMLHttpRequest).getAllResponseHeaders().indexOf('oboku-content-length')) {
              const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
              throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
            }
          }
        })
        await localforage.setItem(`book-download-${bookId}`, response.data)

        setDownloadData(bookId, {
          downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
        })
      } catch (e) {
        setDownloadData(bookId, {
            downloadState: DownloadState.None,
        })
        throw e
      }
    } catch (e) {
      console.error(e)
    }
  }, [client, setDownloadData])
}