import { Reference, ApolloCache } from '@apollo/client';
import { Book, Collection } from '../generated/graphql';

export const removeBookFromCollection = <DATA = any>(cache: ApolloCache<DATA>, bookToRemove: Reference | Book, collection: Reference | Collection) => {
  const collectionWithOutdatedBook = cache.identify(collection)
  const bookToRemoveIdentity = cache.identify(bookToRemove)

  if (collectionWithOutdatedBook && bookToRemoveIdentity) {
    cache.modify({
      id: collectionWithOutdatedBook,
      fields: {
        books: (existingValue: Reference[] = [], { toReference }) => {
          return existingValue.filter(v => cache.identify(v) !== bookToRemoveIdentity)
        }
      }
    })
  }
}

export const addBookToCollection = <DATA = any>(cache: ApolloCache<DATA>, book: Reference | Book, collection: Reference | Collection) => {
  const collectionWithOutdatedBook = cache.identify(collection)
  const bookIdentity = cache.identify(book)

  if (collectionWithOutdatedBook && bookIdentity) {
    cache.modify({
      id: collectionWithOutdatedBook,
      fields: {
        books: (existingValue: Reference[] = [], { toReference }) => [...existingValue, toReference(bookIdentity)]
      }
    })
  }
}