import { useEffect } from 'react'
import localforage from 'localforage';

const POLLING_INTERVAL = 30000

export const RoutineProcess = () => {
  useRevertInvalidDownloads()
  // useMetataRefresher()

  return null
}

const useRevertInvalidDownloads = () => {
  // const client = useOfflineApolloClient()

  useEffect(() => {
    // console.error('todo')

    //   (async () => {
    //     try {
    //       const subscription = client.watchQuery({
    //         query: QueryBooksDownloadStateDocument,
    //       }).subscribe(async ({ data }) => {
    //         subscription.unsubscribe()
    //         const books = data.books || []

    //         try {
    //           const toUpdate = await Promise.all(books.map(async (book) => {
    //             if (book?.downloadState !== 'none') {
    //               const download = await localforage.getItem(`book-download-${book?.id}`)
    //               return download ? null : book?.id
    //             }
    //           }))

    //           toUpdate.forEach(bookId => {
    //             const ref = client.identify({ __typename: 'Book', id: bookId })
    //             ref && client.modify('Book', {
    //               id: ref,
    //               fields: {
    //                 downloadState: _ => DownloadState.None
    //               },
    //             })
    //           })
    //         } catch (e) {
    //           console.error(e)
    //         }
    //       })
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   })()
  }, [])
}