// import localforage from 'localforage';
// import { DownloadState } from '../generated/graphql';
// import { useOfflineApolloClient } from '../useOfflineApolloClient';

// export const useRemoveDownloadFile = () => {
//   const client = useOfflineApolloClient()

//   return async (bookId: string) => {
//     try {
//       await localforage.removeItem(`book-download-${bookId}`)
//       client.modify('Book', {
//         id: client.identify({ __typename: 'Book', id: bookId }),
//         fields: {
//           downloadState: _ => DownloadState.None
//         }
//       })
//     } catch (e) {
//       console.error(e)
//     }
//   }
// }
export {}