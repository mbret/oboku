import { useEffect } from 'react'
import { useApolloClient, useQuery } from '@apollo/client';
import { QueryBooks, QueryBooksData } from './books/queries';
import localforage from 'localforage';
import { gql } from '@apollo/client';
import { Book, DownloadState } from './generated/graphql'

const POLLING_INTERVAL = 30000

export const RoutineProcess = () => {
  useRevertInvalidDownloads()
  useMetataRefresher()

  return null
}

const QueryBooksWithInvalidMetadata = gql`query QueryBooksWithInvalidMetadata { booksMetadata { id lastMetadataUpdatedAt } }`
const QueryBooksWithMetadata = gql`query QueryBooksWithMetadata { booksMetadata { id title lastMetadataUpdatedAt } }`

/**
 * This routine refresh metadata periodically so that books cover, title, etc gets updated automatically
 * when there is a change made by the user in the location
 * 
 * @important
 * This use different query than the regular `books` so that it does not overwite the list of book
 * with outdated list if we ever add a book locally. It will only update individual book metadata.
 */
const useMetataRefresher = () => {
  const client = useApolloClient()
  const { startPolling, stopPolling } = useQuery(QueryBooksWithMetadata, { fetchPolicy: 'network-only',  })

  useEffect(() => {
    client.watchQuery<{ booksMetadata: Book[] }>({ query: QueryBooksWithInvalidMetadata }).subscribe(result => {
      console.log(result)
      const invalidMetadata = result.data.booksMetadata.some(item => item.lastMetadataUpdatedAt === null)
      if (!invalidMetadata) {
        stopPolling()
      } else {
        startPolling(POLLING_INTERVAL)
      }
    })
  }, [client, stopPolling, startPolling])
}

const useRevertInvalidDownloads = () => {
  const client = useApolloClient()

  useEffect(() => {
    (async () => {
      try {
        const subscription = client.watchQuery<QueryBooksData>({
          query: QueryBooks,
        }).subscribe(async ({ data }) => {
          subscription.unsubscribe()
          const books = data.books.books

          const lookForDownload = books.map(async (book) => {
            if (book.downloadState !== 'none') {
              const download = await localforage.getItem(`book-download-${book.id}`)
              console.log(`RoutineProcess checking download file of ${book.id} -> ${typeof download}`)
              return download ? null : book.id
            }
          })

          try {
            const toUpdate = await Promise.all(lookForDownload)

            const existingData = client.readQuery<QueryBooksData>({ query: QueryBooks })
            if (existingData) {
              client.writeQuery<QueryBooksData>({
                query: QueryBooks,
                data: {
                  books: {
                    ...existingData?.books,
                    books: books
                      .map(book => !toUpdate.includes(book.id) ? book : { ...book, downloadState: DownloadState.None })
                  }
                },
              })
            }
          } catch (e) {
            console.error(e)
          }
        })
      } catch (e) {
        console.error(e)
      }
    })()
  }, [client])
}