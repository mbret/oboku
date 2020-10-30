import { useApolloClient } from '@apollo/client';
import { GET_BOOKS } from '../books/queries';
import localforage from 'localforage';

export const useRemoveDownloadFile = () => {
  const client = useApolloClient()

  console.log('re-render')
  return async (bookId: string) => {
    try {
      const data = client.readQuery({ query: GET_BOOKS })
      await localforage.removeItem(`book-download-${bookId}`)
      client.writeQuery({
        query: GET_BOOKS,
        data: { books: data.books.map(book => book.id !== bookId ? book : { ...book, downloadState: 'none' }) },
      })
      console.log('done')
    } catch (e) {
      console.error(e)
    }
  }
}