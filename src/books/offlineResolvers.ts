import { generateUniqueID } from "../utils";
import { MutationAddBookArgs, MutationRemoveBookArgs, MutationEditBookDocument, Book, DownloadState, QueryBookDocument, BookAssociationIdsFragmentDoc, ReadingStateState } from '../generated/graphql'
import { Reference } from "@apollo/client";
import { OfflineApolloClient } from "../client";

type ResolverContext = { client: OfflineApolloClient<any> }

export const bookOfflineResolvers = {
  addBook: (variables: Omit<MutationAddBookArgs, 'id'>, { client }: ResolverContext): Book => {
    const book: Required<Book> = {
      __typename: 'Book' as const,
      id: generateUniqueID(),
      lastMetadataUpdatedAt: null,
      title: null,
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentBookmarkProgressUpdatedAt: null,
      readingStateCurrentBookmarkProgressPercent: 0,
      readingStateCurrentState: ReadingStateState.NotStarted,
      createdAt: 1604302214598,
      downloadState: DownloadState.None,
      downloadProgress: 0,
      language: null,
      tags: [],
      links: [],
      date: Date.now(),
      publisher: null,
      rights: null,
      subject: null,
      creator: null,
      collections: [],
      ...variables,
    }

    // create the offline books reference
    client.cache.writeQuery({ query: QueryBookDocument, variables: { id: book.id }, data: { book } })
    client.modify('Query', {
      fields: {
        books: (existing = [], { toReference }) => {
          const ref = toReference(book)
          if (ref) return [...existing, ref]
          return existing
        }
      }
    })

    return book
  },
  removeBook: ({ id }: MutationRemoveBookArgs, { client }: ResolverContext) => {
    const itemRef = client.cache.identify({ id, __typename: 'Book' })
    const associations = client.readFragment({
      id: itemRef,
      fragment: BookAssociationIdsFragmentDoc,
    })
    // @see https://www.apollographql.com/docs/react/caching/garbage-collections/#dangling-references
    client.cache.evict({ id: itemRef })
    // prune book from books
    client.modify('Query', {
      fields: {
        books: (existing = [], { canRead }) => existing.filter(canRead)
      }
    })
    // prune book from tags
    associations?.tags?.forEach(tag => {
      client.modify('Tag', {
        id: client.identify({ __typename: 'Tag', id: tag?.id }),
        fields: {
          books: (existing: Reference[], { canRead }) => existing.filter(canRead)
        },
      })
    })
    // prune book from collections
    associations?.collections?.forEach(collection => {
      client.modify('Collection', {
        id: client.identify({ __typename: 'Collection', id: collection?.id }),
        fields: {
          books: (existing: Reference[], { canRead }) => existing.filter(canRead)
        }
      })
    })
  },
  editBook: ({ id, ...rest }: NonNullable<typeof MutationEditBookDocument['__variablesType']> & { tags?: string[] }, { client }: ResolverContext) => {
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
      }
    })

    // Eventually add the book to any associated tags and collection
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
  },
}