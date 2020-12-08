import localforage from 'localforage';
import { API_URI } from '../constants';
import axios from 'axios'
import { useCallback } from 'react';
import throttle from 'lodash.throttle';

export const useDownloadFile = () => {
  return (id: string) => {
    console.error('todo')

  }
  // const client = useApolloClient()
  // const writeBookDownloadState = useWriteBookDownloadState()

  // return useCallback(async (bookId: string) => {
  //   const throttleSetProgress = throttle((progress: number) => {
  //     writeBookDownloadState(bookId, existing => ({
  //       book: {
  //         ...existing.book,
  //         downloadProgress: progress,
  //       }
  //     }))
  //   }, 500)

  //   try {
  //     const authData = client.readQuery({ query: QueryUserAuthStateDocument })

  //     writeBookDownloadState(bookId, existing => ({
  //       book: {
  //         ...existing.book,
  //         downloadProgress: 0,
  //         downloadState: DownloadState.Downloading,
  //       }
  //     }))

  //     try {
  //       const response = await axios({
  //         url: `${API_URI}/download/${bookId}`,
  //         headers: {
  //           Authorization: `Bearer ${authData?.user?.token}`
  //         },
  //         responseType: 'blob',
  //         onDownloadProgress: (event: ProgressEvent) => {
  //           const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
  //           throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
  //         }
  //       })
  //       await localforage.setItem(`book-download-${bookId}`, response.data)

  //       writeBookDownloadState(bookId, existing => ({
  //         book: {
  //           ...existing.book,
  //           downloadProgress: 100,
  //           downloadState: DownloadState.Downloaded,
  //         }
  //       }))
  //     } catch (e) {
  //       writeBookDownloadState(bookId, existing => ({
  //         book: {
  //           ...existing.book,
  //           downloadState: DownloadState.None,
  //         }
  //       }))
  //       throw e
  //     }
  //   } catch (e) {
  //     console.error(e)
  //   }
  // }, [client, writeBookDownloadState])
}