import localforage from 'localforage';
import { useCallback } from 'react';
import throttle from 'lodash.throttle';
import { UnwrapRecoilValue, useSetRecoilState } from 'recoil';
import { DownloadState, normalizedBookDownloadsState } from './states';
import { useAxiosClient } from '../axiosClient';
import { Report } from '../report';
import { useDatabase } from '../rxdb';
import { LinkType } from 'oboku-shared';
import { useGetLazySignedGapi } from '../dataSources/google/helpers';
import { DOWNLOAD_PREFIX } from '../constants';

export const useDownloadFile = () => {
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)
  const client = useAxiosClient()
  const database = useDatabase()
  const [getLazySignedGapi] = useGetLazySignedGapi()

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
        if (await localforage.getItem(`${DOWNLOAD_PREFIX}-${bookId}`)) {
          setDownloadData(bookId, {
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
          })
          return
        }

        const book = await database?.book.findOne({ selector: { _id: bookId} }).exec()
        const firstLink = await database?.link.findOne({ selector: { _id: book?.links[0]} }).exec()
        let credentials
        switch (firstLink?.type) {
          case LinkType.Drive: {
            credentials = (await getLazySignedGapi())?.credentials
            break
          }
          default:
        }

        const response = await client.downloadBook(bookId, credentials || {}, {
          onDownloadProgress: (event: ProgressEvent) => {
            if ((event.target as XMLHttpRequest).getAllResponseHeaders().indexOf('oboku-content-length')) {
              const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
              throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
            }
          }
        })
        await localforage.setItem(`${DOWNLOAD_PREFIX}-${bookId}`, response.data)

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
      Report.error(e)
    }
  }, [client, setDownloadData, database, getLazySignedGapi])
}