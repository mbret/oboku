import { Reference, ApolloCache } from '@apollo/client';
import { Book, Series } from '../generated/graphql';

export const removeBookFromSeries = <DATA = any>(cache: ApolloCache<DATA>, bookToRemove: Reference | Book, series: Reference | Series) => {
  const seriesWithOutdatedBook = cache.identify(series)
  const bookToRemoveIdentity = cache.identify(bookToRemove)

  if (seriesWithOutdatedBook && bookToRemoveIdentity) {
    cache.modify({
      id: seriesWithOutdatedBook,
      fields: {
        books: (existingValue: Reference[] = [], { toReference }) => {
          console.log('ASDASDASDASD', existingValue, seriesWithOutdatedBook, existingValue.filter(v => cache.identify(v) !== bookToRemoveIdentity))

          return existingValue.filter(v => cache.identify(v) !== bookToRemoveIdentity)
        }
      }
    })
  }
}

export const addBookToSeries = <DATA = any>(cache: ApolloCache<DATA>, book: Reference | Book, series: Reference | Series) => {
  const seriesWithOutdatedBook = cache.identify(series)
  const bookIdentity = cache.identify(book)

  if (seriesWithOutdatedBook && bookIdentity) {
    cache.modify({
      id: seriesWithOutdatedBook,
      fields: {
        books: (existingValue: Reference[] = [], { toReference }) => [...existingValue, toReference(bookIdentity)]
      }
    })
  }
}