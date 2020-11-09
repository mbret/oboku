import { generateUniqueID } from "../utils";
import { MutationAddBookVariables, MutationRemoveBookVariables, MutationEditBookVariables, MutationAddBookData, ID } from 'oboku-shared'
import { ApolloClient, Reference } from "@apollo/client";
import { GET_BOOK, QueryBooks, QueryBooksData, QueryGetBookData, QueryGetBookVariables } from "./queries";
import { LocalBook } from "./types";

type ResolverContext = { client: ApolloClient<any> }

export const bookOfflineResolvers = {
  addBook: (variables: Omit<MutationAddBookVariables, 'id'>, { client }: ResolverContext): MutationAddBookData => {
    const book: Required<LocalBook> = {
      __typename: 'Book' as const,
      id: generateUniqueID(),
      lastMetadataUpdatedAt: null,
      title: null,
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentBookmarkProgressUpdatedAt: null,
      readingStateCurrentBookmarkProgressPercent: 0,
      createdAt: 1604302214598,
      downloadState: 'none',
      downloadProgress: 0,
      tags: [],
      links: [],
      author: '',
      series: [],
      ...variables,
    }

    // create the offline books reference
    client.cache.writeQuery<QueryGetBookData, QueryGetBookVariables>({ query: GET_BOOK, variables: { id: book.id }, data: { book } })
    const queryBooksData = client.readQuery<QueryBooksData>({ query: QueryBooks })
    if (queryBooksData) {
      client.writeQuery<QueryBooksData>({
        query: QueryBooks, data: {
          books: {
            ...queryBooksData.books,
            books: [...queryBooksData.books.books, book]
          }
        }
      })
    }

    return book
  },
  removeBook: ({ id }: MutationRemoveBookVariables, { client }: ResolverContext) => {
    const itemRef = client.cache.identify({ id, __typename: 'Book' })
    if (itemRef) {
      // @see https://www.apollographql.com/docs/react/caching/garbage-collection/#dangling-references
      client.cache.evict({ id: itemRef })
      client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'book', args: { id } })
      client.cache.gc()
    }

    const queryBooksData = client.readQuery<QueryBooksData>({ query: QueryBooks })
    if (queryBooksData) {
      client.writeQuery<QueryBooksData>({
        query: QueryBooks, data: {
          books: {
            ...queryBooksData.books,
            books: queryBooksData.books.books.filter(item => item.id !== id)
          }
        }
      })
    }
  },
  editBook: ({ id, ...rest }: MutationEditBookVariables & { tags?: ID[], series?: ID[] }, { client }: ResolverContext) => {
    const editedBookId = client.cache.identify({ id, __typename: 'Book' })
    console.log('modify', editedBookId, rest)

    if (!editedBookId) return

    client.cache.modify({
      id: editedBookId,
      fields: {
        lastMetadataUpdatedAt: (prev) =>
          rest.lastMetadataUpdatedAt === undefined ? prev : rest.lastMetadataUpdatedAt,
        readingStateCurrentBookmarkLocation: (prev) =>
          rest.readingStateCurrentBookmarkLocation === undefined ? prev : rest.readingStateCurrentBookmarkLocation,
        readingStateCurrentBookmarkProgressPercent: (prev) =>
          rest.readingStateCurrentBookmarkProgressPercent === undefined ? prev : rest.readingStateCurrentBookmarkProgressPercent,
        tags: (prev, { toReference }) =>
          rest.tags?.map(itemId => {
            const item = client.cache.identify({ id: itemId, __typename: 'Tag' })
            return item && toReference(item)
          }) || prev,
        series: (prev, { toReference }) =>
          rest.series?.map(itemId => {
            const item = client.cache.identify({ id: itemId, __typename: 'Series' })
            return item && toReference(item)
          }) || prev
      }
    })

    // Eventually add the book to any associated tags and series
    if (rest.tags) {
      rest.tags.forEach(itemId => {
        const item = client.cache.identify({ id: itemId, __typename: 'Tag' })
        if (item) {
          client.cache.modify({
            id: item,
            fields: {
              books: (prev: Reference[], { toReference }) => {
                if (prev.find(bookRef => bookRef.__ref === editedBookId)) return prev
                return [...prev, toReference(editedBookId)]
              }
            }
          })
        }
      })
    }
    if (rest.series) {
      rest.series.forEach(itemId => {
        const item = client.cache.identify({ id: itemId, __typename: 'Series' })
        if (item) {
          client.cache.modify({
            id: item,
            fields: {
              books: (prev: Reference[], { toReference }) => {
                if (prev.find(bookRef => bookRef.__ref === editedBookId)) return prev
                return [...prev, toReference(editedBookId)]
              }
            }
          })
        }
      })
    }
  },
}