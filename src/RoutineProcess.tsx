import { useEffect } from 'react'
import localforage from 'localforage';
import { Book, DownloadState, QueryBookIdsDocument, QueryBooksDownloadStateDocument } from './generated/graphql'
import { useOfflineApolloClient } from './useOfflineApolloClient';

const POLLING_INTERVAL = 30000

export const RoutineProcess = () => {
  useRevertInvalidDownloads()
  // useMetataRefresher()

  return null
}

/**
 * This routine refresh metadata periodically so that books cover, title, etc gets updated automatically
 * when there is a change made by the user in the location
 * 
 * @important
 * This use different query than the regular `books` so that it does not overwite the list of book
 * with outdated list if we ever add a book locally. It will only update individual book metadata.
 */
// const useMetataRefresher = () => {
//   const client = useApolloClient()
//   const { startPolling, stopPolling } = useQuery(QueryBooksWithMetadataDocument, { fetchPolicy: 'network-only',  })

//   useEffect(() => {
//     client.watchQuery<{ booksMetadata: Book[] }>({ query: QueryBooksWithInvalidMetadataDocument }).subscribe(result => {
//       console.log(result)
//       const invalidMetadata = result.data.booksMetadata.some(item => item.lastMetadataUpdatedAt === null)
//       if (!invalidMetadata) {
//         stopPolling()
//       } else {
//         startPolling(POLLING_INTERVAL)
//       }
//     })
//   }, [client, stopPolling, startPolling])
// }

const useRevertInvalidDownloads = () => {
  const client = useOfflineApolloClient()

  useEffect(() => {
    (async () => {
      try {
        const subscription = client.watchQuery({
          query: QueryBooksDownloadStateDocument,
        }).subscribe(async ({ data }) => {
          subscription.unsubscribe()
          const books = data.books || []

          try {
            const toUpdate = await Promise.all(books.map(async (book) => {
              if (book?.downloadState !== 'none') {
                const download = await localforage.getItem(`book-download-${book?.id}`)
                return download ? null : book?.id
              }
            }))

            toUpdate.forEach(bookId => {
              const ref = client.identify({ __typename: 'Book', id: bookId })
              ref && client.modify('Book', {
                id: ref,
                fields: {
                  downloadState: _ => DownloadState.None
                },
              })
            })
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