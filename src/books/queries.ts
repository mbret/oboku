import { gql, useQuery, QueryHookOptions, useMutation, useApolloClient } from '@apollo/client';
import { Book } from '../client';
import { difference } from 'ramda';
import { useCallback } from 'react';
import { removeBookFromSeries, addBookToSeries } from '../series/cacheHelpers';

export const BOOK_DETAILS_FRAGMENT = gql`
  fragment BookDetails on Book {
    id
    lastMetadataUpdatedAt
    title
    url
    downloadState @client
  }
`

type GET_BOOKS_DATA = { books: Book[] }
export const GET_BOOKS = gql`
  query BOOKS {
    books {
      id
      title
      lastMetadataUpdatedAt
      downloadState @client
      url
      tags {
        id
      }
    }
  }
`;

type GET_BOOK_DATA = { book: Book }
type GET_BOOK_VARIABLES = {
  id: string
}
export const GET_BOOK = gql`
  query GET_BOOK($id: ID!) {
    book(id: $id) {
      id
      downloadState @client
      title
      location
      tags {
        id
        name
      }
      series {
        id
        name
      }
    }
  }
`;

export const REMOVE_BOOK = gql`
  mutation REMOVE_BOOK($id: ID!) {
    removeBook(id: $id) {
      affectedRows
    }
  }
`;

export const REFRESH_BOOK_METADATA = gql`
  mutation REFRESH_BOOK_METADATA($id: ID!) {
    editBook(id: $id, lastMetadataUpdatedAt: null) {
      id
      lastMetadataUpdatedAt
    }
  }
`;

type EDIT_BOOK_DATA = { editBook: Book }
type EDIT_BOOK_VARIABLES = {
  id: string,
  location?: string,
  tags?: string[],
  series?: string[]
}
export const EDIT_BOOK = gql`
  mutation EDIT_BOOK($id: ID!, $location: String, $tags: [ID], $series: [ID]) {
    editBook(id: $id, location: $location, tags: $tags, series: $series) {
      id
      location
      tags {
        id
      }
      series {
        id
      }
    }
  }
`;

export const useMutationEditBook = () => {
  const [editBook] = useMutation<EDIT_BOOK_DATA, EDIT_BOOK_VARIABLES>(EDIT_BOOK)
  const client = useApolloClient()

  const withEffectEditBook: typeof editBook = useCallback((options) => {
    const oldBook = client.cache.readQuery<GET_BOOK_DATA>({ query: GET_BOOK, variables: { id: options?.variables?.id } })
    const oldSeries = oldBook?.book?.series || []

    return editBook({
      ...options,
      update: (cache, result) => {
        const { variables } = options || {}
        const newSeries = result?.data?.editBook?.series || []
        const book = result?.data?.editBook || {}
        const bookIdentity = cache.identify(book)

        if (bookIdentity && variables?.series !== undefined) {
          const removed = difference(oldSeries, newSeries)
          const added = difference(newSeries, oldSeries)
          removed.forEach(series => removeBookFromSeries(cache, book, series))
          added.forEach(series => addBookToSeries(cache, book, series))
        }

        if (options?.update) {
          options?.update(cache, result)
        }
      }
    })
  }, [editBook, client])

  return [withEffectEditBook]
}

export const useQueryGetBooks = (options?: QueryHookOptions<GET_BOOKS_DATA>) =>
  useQuery<GET_BOOKS_DATA>(GET_BOOKS, options)

export const useQueryGetBook = (options: QueryHookOptions<GET_BOOK_DATA, GET_BOOK_VARIABLES>) =>
  useQuery<GET_BOOK_DATA, GET_BOOK_VARIABLES>(GET_BOOK, options)