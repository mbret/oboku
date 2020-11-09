import { gql, useQuery, QueryHookOptions as QueryBookOptions, useMutation, useApolloClient, useLazyQuery } from '@apollo/client';
import {
  Book, MutationAddBookVariables, MutationRemoveBookVariables, MutationRemoveBookData,
  MutationAddLinkVariables, Link, MutationEditBookVariables, MutationAddBookData, MutationAddTagsToBookVariables, MutationRemoveTagsToBookVariables
} from 'oboku-shared'
import { difference } from 'ramda';
import { useCallback } from 'react';
import { bookOfflineResolvers } from './offlineResolvers';
import { LocalBook } from './types';
import { ID } from 'oboku-shared'
import { useAddLink } from '../links/queries';
import { useUser } from '../auth/queries';

export type QueryGetBookData = { book: Required<Pick<LocalBook, 'id'>> & LocalBook }
export type QueryGetBookVariables = { id: string }

export type QueryGetBooksData = { book: LocalBook[] }

export const BOOK_DETAILS_FRAGMENT = gql`
  fragment BookDetails on Book {
    __typename
    id
    lastMetadataUpdatedAt
    title
    downloadState @client
    downloadProgress @client
    readingStateCurrentBookmarkLocation
    readingStateCurrentBookmarkProgressUpdatedAt
    readingStateCurrentBookmarkProgressPercent
    createdAt
    tags {
      id
      name
      isProtected
    }
    links {
      id
      location
    }
    series {
      id
      name
    }
  }
`

export type QueryBooksData = {
  books: {
    __typename: 'Books',
    timestamp: number,
    books: (
      Required<LocalBook>
    )[]
  }
}
export const QueryBooks = gql`
  query QueryBooks {
    books {
      __typename
      timestamp
      books {
        ...BookDetails
      }
    }
  }
  ${BOOK_DETAILS_FRAGMENT}
`;

export const GET_BOOK = gql`
  query GET_BOOK($id: ID!) {
    book(id: $id) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS_FRAGMENT}
`;

type REMOVE_BOOK_DATA = { removeBook: MutationRemoveBookData }
export const MutationRemoveBook = {
  name: 'RemoveBook',
  operation: gql`
    mutation RemoveBook($id: ID!) {
      removeBook(id: $id) {
        id
      }
    }
  `
}

type EDIT_BOOK_DATA = { editBook: Book }
export const EDIT_BOOK = gql`
  mutation EDIT_BOOK(
    $id: ID!, 
    $lastMetadataUpdatedAt: Float,
    $readingStateCurrentBookmarkLocation: String,
    $readingStateCurrentBookmarkProgressPercent: Float
  ) {
    editBook(
      id: $id, 
      lastMetadataUpdatedAt: $lastMetadataUpdatedAt
      readingStateCurrentBookmarkLocation: $readingStateCurrentBookmarkLocation,
      readingStateCurrentBookmarkProgressPercent: $readingStateCurrentBookmarkProgressPercent
    ) {
      id
    }
  }
`;

export const MutationAddBook = {
  name: 'AddBook',
  operation: gql`
    mutation AddBook($id: ID!, $location: String!) {
      addBook(id: $id, location: $location) {
        id
      }
    }
  `
}

export const MutationAddTagsToBook = gql`
  mutation MutationAddTagsToBook($id: ID!, $tags: [ID]!) {
    addTagsToBook(id: $id, tags: $tags) {
      id
    }
  }
`

export const MutationRemoveTagsToBook = gql`
  mutation MutationRemoveTagsToBook($id: ID!, $tags: [ID]!) {
    removeTagsToBook(id: $id, tags: $tags) {
      id
    }
  }
`

export const MutationAddSeriesToBook = gql`
  mutation MutationAddSeriesToBook($id: ID!, $series: [ID]!) {
    addSeriesToBook(id: $id, series: $series) {
      id
    }
  }
`

export const MutationRemoveSeriesToBook = gql`
  mutation MutationRemoveSeriesToBook($id: ID!, $series: [ID]!) {
    removeSeriesToBook(id: $id, series: $series) {
      id
    }
  }
`

export const useRemoveBook = () => {
  const client = useApolloClient()
  const [removeBook] = useMutation<REMOVE_BOOK_DATA, MutationRemoveBookVariables>(MutationRemoveBook.operation);

  return useCallback((id: string) => {
    bookOfflineResolvers.removeBook({ id }, { client })

    return removeBook({ variables: { id } })
  }, [removeBook, client])
}

export const useAddBook = () => {
  const client = useApolloClient()
  const [addBook] = useMutation<{ addBook: MutationAddBookData }, MutationAddBookVariables>(MutationAddBook.operation)
  const addLink = useAddLink()

  return useCallback(async (location: string) => {
    const book = bookOfflineResolvers.addBook({ location }, { client })

    addBook({ variables: { location, id: book.id } })
    // @todo it should wait for book being created
    addLink(location, book.id)
  }, [addBook, client, addLink])
}

export const useEditBook = () => {
  const [editBook] = useMutation<EDIT_BOOK_DATA, MutationEditBookVariables>(EDIT_BOOK)
  const [addSeriesToBook] = useMutation<any, any>(MutationAddSeriesToBook)
  const [removeSeriesToBook] = useMutation<any, any>(MutationRemoveSeriesToBook)
  const [addTagsToBook] = useMutation<any, MutationAddTagsToBookVariables>(MutationAddTagsToBook)
  const [removeTagsToBook] = useMutation<any, MutationRemoveTagsToBookVariables>(MutationRemoveTagsToBook)
  const client = useApolloClient()

  return useCallback((variables: MutationEditBookVariables & { tags?: ID[], series?: ID[] }) => {
    const oldData = client.cache.readQuery<QueryGetBookData>({ query: GET_BOOK, variables: { id: variables.id } })

    bookOfflineResolvers.editBook(variables, { client })

    const { tags, series, id, ...rest } = variables

    if (Object.keys(rest).length > 0) {
      editBook({ variables: { id, ...rest } })
    }

    if (oldData?.book) {
      if (tags) {
        const existingTags = (oldData.book.tags || []).map(item => item.id || '')
        const removed = difference(existingTags, tags)
        const added = difference(tags, existingTags)

        if (added.length > 0) {
          addTagsToBook({ variables: { id: variables.id, tags: added } })
        }

        if (removed.length > 0) {
          removeTagsToBook({ variables: { id: variables.id, tags: removed } })
        }
      }

      if (series) {
        const existingSeries = (oldData.book.series || []).map(item => item.id || '')
        const removed = difference(existingSeries, series)
        const added = difference(series, existingSeries)

        if (added.length > 0) {
          addSeriesToBook({ variables: { id: variables.id, series: added } })
        }

        if (removed.length > 0) {
          removeSeriesToBook({ variables: { id: variables.id, series: removed } })
        }
      }
    }
  }, [editBook, client, addSeriesToBook, addTagsToBook, removeSeriesToBook, removeTagsToBook])
}

export const useLazyBooks = () => useLazyQuery<QueryGetBooksData, any>(QueryBooks)
export const useLazyBook = () => useLazyQuery<QueryGetBookData, QueryGetBookVariables>(GET_BOOK)

export const useQueryGetBooks = (options?: QueryBookOptions<QueryBooksData>) => {
  const { data } = useQuery<QueryBooksData>(QueryBooks, { ...options })
  const { data: userData } = useUser()
  const books = data?.books
  const isLibraryUnlocked = userData?.user.isLibraryUnlocked || false

  if (!books) return { data: books }

  if (isLibraryUnlocked) return { data: books.books }

  return { data: books.books.filter(book => !book.tags.some(tag => tag.isProtected)) }
}

export const useBook = (options: QueryBookOptions<QueryGetBookData, QueryGetBookVariables>) =>
  useQuery<QueryGetBookData, QueryGetBookVariables>(GET_BOOK, options)