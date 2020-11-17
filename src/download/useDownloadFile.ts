import { gql, useApolloClient } from '@apollo/client';
import localforage from 'localforage';
import { API_URI } from '../constants';
import axios from 'axios'
import { useCallback } from 'react';
import throttle from 'lodash.throttle';
import { Book, DownloadState, QueryAuthDocument } from '../generated/graphql';

type QueryBookDownloadStateData = { book: Required<Pick<Book, 'downloadState' | 'downloadProgress'>> }
type QueryBookDownloadStateVariables = { id: string }
export const QueryBookDownloadState = gql`
  query QueryBookDownloadState($id: ID!) {
    book(id: $id) {
      id
      downloadState @client
      downloadProgress @client
    }
  }
`;

const useQueryBookDownloadState = () => {
  const client = useApolloClient()

  return (id: string) => client.readQuery<QueryBookDownloadStateData, QueryBookDownloadStateVariables>({ query: QueryBookDownloadState, variables: { id } })
}

const useWriteBookDownloadState = () => {
  const client = useApolloClient()
  const queryBookDownloadState = useQueryBookDownloadState()

  return (id: string, update: (data: QueryBookDownloadStateData) => QueryBookDownloadStateData) => {
    const data = queryBookDownloadState(id)
    if (data) {
      client.writeQuery<QueryBookDownloadStateData, QueryBookDownloadStateVariables>({ query: QueryBookDownloadState, variables: { id }, data: update(data) })
    }
  }
}

export const useDownloadFile = () => {
  const client = useApolloClient()
  const writeBookDownloadState = useWriteBookDownloadState()

  return useCallback(async (bookId: string) => {
    const throttleSetProgress = throttle((progress: number) => {
      writeBookDownloadState(bookId, existing => ({
        book: {
          ...existing.book,
          downloadProgress: progress,
        }
      }))
    }, 500)

    try {
      const authData = client.readQuery({ query: QueryAuthDocument })

      writeBookDownloadState(bookId, existing => ({
        book: {
          ...existing.book,
          downloadProgress: 0,
          downloadState: DownloadState.Downloading,
        }
      }))

      try {
        const response = await axios({
          url: `${API_URI}/download/${bookId}`,
          headers: {
            Authorization: `Bearer ${authData?.auth?.token}`
          },
          responseType: 'blob',
          onDownloadProgress: (event: ProgressEvent) => {
            const contentLength = parseInt((event.target as XMLHttpRequest).getResponseHeader('oboku-content-length') || '1')
            throttleSetProgress(Math.round((event.loaded / contentLength) * 100))
          }
        })
        await localforage.setItem(`book-download-${bookId}`, response.data)

        writeBookDownloadState(bookId, existing => ({
          book: {
            ...existing.book,
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
          }
        }))
      } catch (e) {
        writeBookDownloadState(bookId, existing => ({
          book: {
            ...existing.book,
            downloadState: DownloadState.None,
          }
        }))
        throw e
      }
    } catch (e) {
      console.error(e)
    }
  }, [client, writeBookDownloadState])
}