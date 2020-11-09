import { useApolloClient } from '@apollo/client';
import { QueryBooks, QueryBooksData } from '../books/queries';
import localforage from 'localforage';

export const useRemoveDownloadFile = () => {
  const client = useApolloClient()

  return async (bookId: string) => {
    try {
      const data = client.readQuery<QueryBooksData>({ query: QueryBooks })
      await localforage.removeItem(`book-download-${bookId}`)
      if (data) {
        client.writeQuery<QueryBooksData>({
          query: QueryBooks,
          data: {
            books: {
              ...data.books,
              books: data.books.books.map(book => book.id !== bookId ? book : { ...book, downloadState: 'none' })
            }
          },
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
}