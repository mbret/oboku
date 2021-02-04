import localforage from 'localforage';
import { useCallback } from 'react';
import throttle from 'lodash.throttle';
import { UnwrapRecoilValue, useSetRecoilState } from 'recoil';
import { DownloadState, normalizedBookDownloadsState } from './states';
import { Report } from '../report';
import { useDatabase } from '../rxdb';
import { DOWNLOAD_PREFIX } from '../constants';
import { useDownloadBookFromDataSource } from '../dataSources/helpers';
import { BookFile } from './types';
import { DataSourceType } from 'oboku-shared';

export const useDownloadBook = () => {
  const downloadBook = useDownloadBookFromDataSource()
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)
  const database = useDatabase()

  const setDownloadData = useCallback((bookId: string, data: UnwrapRecoilValue<typeof normalizedBookDownloadsState>[number]) => {
    setBookDownloadsState(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        ...data,
      }
    }))
  }, [setBookDownloadsState])

  return useCallback(async (bookId: string, file?: File) => {
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
        // for some reason if the file exist we do not download it again
        if (await localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)) {
          setDownloadData(bookId, {
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
          })
          return
        }

        const book = await database?.book.findOne({ selector: { _id: bookId } }).exec()
        const firstLink = await database?.link.findOne({ selector: { _id: book?.links[0] } }).exec()

        if (!firstLink) throw new Error('invalid link')

        // local file
        if (firstLink.type === DataSourceType.FILE && file) {
          await localforage.setItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`, { data: file, name: file.name })
        } else {
          // const credentials = await getDataSourceCredentials(firstLink.type)
          const dataSourceResponse = await downloadBook(firstLink, {
            onDownloadProgress: (event: ProgressEvent, totalSize: number) => {
              // if ((event.target as XMLHttpRequest).getAllResponseHeaders().indexOf('oboku-content-length')) {
                // const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
                // throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
                throttleSetProgress(Math.round((event.loaded / totalSize) * 100))
              // }
            }
          })

          if ('isError' in dataSourceResponse && dataSourceResponse.reason === 'cancelled') {
            setDownloadData(bookId, {
              downloadState: DownloadState.None,
            })
            return
          }

          if ('isError' in dataSourceResponse) throw dataSourceResponse.error || new Error(dataSourceResponse.reason)
          // const response = await client.downloadBook(bookId, credentials || {}, {
          //   onDownloadProgress: (event: ProgressEvent) => {
          //     if ((event.target as XMLHttpRequest).getAllResponseHeaders().indexOf('oboku-content-length')) {
          //       const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
          //       throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
          //     }
          //   }
          // })
          await localforage.setItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`, dataSourceResponse)
        }

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
  }, [setDownloadData, database, downloadBook])
}