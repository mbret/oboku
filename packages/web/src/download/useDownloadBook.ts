import localforage from 'localforage';
import { useCallback } from 'react';
import throttle from 'lodash.throttle';
import { UnwrapRecoilValue, useRecoilCallback, useSetRecoilState } from 'recoil';
import { DownloadState, normalizedBookDownloadsState } from './states';
import { Report } from '../debug/report';
import { useDatabase } from '../rxdb';
import { DOWNLOAD_PREFIX } from '../constants.shared';
import { useDownloadBookFromDataSource, useGetDataSourceCredentials } from '../dataSources/helpers';
import { BookFile } from './types';
import { BookDocType, DataSourceType } from '@oboku/shared';
import { useGetLazySignedGapi } from '../dataSources/google/helpers';
import { linkState } from '../links/states';
import { useDialogManager } from '../dialog';

export const useDownloadBook = () => {
  const getDataSourceCredentials = useGetDataSourceCredentials()
  const downloadBook = useDownloadBookFromDataSource()
  const setBookDownloadsState = useSetRecoilState(normalizedBookDownloadsState)
  const database = useDatabase()
  const [getLazySignedGapi] = useGetLazySignedGapi()
  const dialog = useDialogManager()

  const setDownloadData = useCallback((bookId: string, data: UnwrapRecoilValue<typeof normalizedBookDownloadsState>[number]) => {
    setBookDownloadsState(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        ...data,
      }
    }))
  }, [setBookDownloadsState])

  return useRecoilCallback(({ snapshot }) => async ({ _id: bookId, links }: Pick<BookDocType, `_id` | `links`>, localFile?: File) => {
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

      const firstLink = await snapshot.getPromise(linkState(links[0] || ``))

      if (!firstLink) {
        // @todo add dialog to tell book is broken
        throw new Error('invalid link')
      }

      /**
       * Because in order for an eventual oauth popup to show up we need to trigger it
       * as soon as possible. we pre-fetch credentials this way before doing the rest of async stuff.
       * 
       * @example
       * Safari will not show the popup if you don't trigger it right after user click.
       * Chrome seems to be okay with anything.
       */
      await getDataSourceCredentials(firstLink.type)

      // for some reason if the file exist we do not download it again
      if (await localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)) {
        setDownloadData(bookId, {
          downloadProgress: 100,
          downloadState: DownloadState.Downloaded,
        })
        return
      }

      if (firstLink.type === DataSourceType.FILE) {
        if (localFile) {
          await localforage.setItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`, { data: localFile, name: localFile.name })
        } else {
          Report.error(`Something is wrong as you are trying to download local book without passing the local file. Either you forgot to download properly the book back when the user added it or there is a invalid state and the book should open instead.`)

          // @todo show a dialog
          throw new Error(`Cannot download local file from another device`)
        }
      } else {
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

        if ('isError' in dataSourceResponse && dataSourceResponse.reason === 'notFound') {
          setDownloadData(bookId, {
            downloadState: DownloadState.None,
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

        if ('isError' in dataSourceResponse) {
          throw dataSourceResponse.error || new Error(dataSourceResponse.reason)
        }
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
      Report.error(e)
    }
  }, [setDownloadData, database, downloadBook, getLazySignedGapi])
}