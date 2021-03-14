import { intersection } from "ramda";
import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil";
import { BookDocType } from '@oboku/shared'
import { libraryState } from "../library/states";
import { normalizedTagsState, protectedTagIdsState } from "../tags/states";
import { linkState } from "../links/states";
import { bookDownloadsState, DownloadState, normalizedBookDownloadsState } from "../download/states";
import { collectionState, normalizedCollectionsState } from "../collections/states";
import { DataSourceType } from "@oboku/shared";

export type Book = NonNullable<UnwrapRecoilValue<typeof normalizedBooksState>[number]>

const isBookProtected = (protectedTags: string[], book: BookDocType) => intersection(protectedTags, book?.tags || []).length > 0

export const normalizedBooksState = atom<Record<string, BookDocType | undefined>>({
  key: 'books',
  default: {}
})

export const bookState = selectorFamily({
  key: 'bookState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const tags = get(normalizedTagsState)
    const collections = get(normalizedCollectionsState)

    if (!book) return undefined

    return {
      ...book,
      collections: book?.collections.filter(id => !!collections[id]),
      tags: book?.tags.filter(id => !!tags[id]),
    }
  }
})

export const enrichedBookState = selectorFamily({
  key: 'enrichedBookState',
  get: (bookId: string) => ({ get }) => {
    const book = get(bookState(bookId))
    const downloadState = get(bookDownloadsState(bookId))
    const protectedTags = get(protectedTagIdsState)

    if (!book) return undefined

    const firstLink = get(linkState(book.links[0]))

    const isLocal = firstLink?.type === DataSourceType.FILE

    return {
      ...book,
      ...downloadState || {},
      isLocal,
      isProtected: isBookProtected(protectedTags, book),
      // hasLink: book.links.length > 0
      canRefreshMetadata: book.links.length > 0 && !isLocal
    }
  }
})

export const downloadedBookIdsState = selector({
  key: 'downloadedBookIdsState',
  get: ({ get }) => {
    const book = get(protectedBookIdsState)
    const downloadState = get(normalizedBookDownloadsState)

    return book.filter(id => downloadState[id]?.downloadState === DownloadState.Downloaded)
  }
})

export const booksAsArrayState = selector({
  key: 'booksAsArray',
  get: ({ get }) => {
    const books = get(normalizedBooksState)
    const bookIds = get(protectedBookIdsState)

    return bookIds.map(id => {
      const downloadState = get(bookDownloadsState(id))
      
      return {
        ...books[id] as Book,
        downloadState,
      }
    })
  }
})

export const bookIdsState = selector({
  key: 'bookIdsState',
  get: ({ get }) => {
    const books = get(normalizedBooksState)

    return Object.keys(books)
  }
})

export const protectedBookIdsState = selector({
  key: 'protectedBookIdsState',
  get: ({ get }) => {
    const books = get(normalizedBooksState)
    const { isLibraryUnlocked } = get(libraryState)
    const protectedTags = get(protectedTagIdsState)

    if (isLibraryUnlocked) return Object.keys(books)

    return Object.values(books).filter(book => intersection(protectedTags, book?.tags || []).length === 0).map(book => book?._id || '-1')
  }
})

export const bookTagsState = selectorFamily({
  key: 'bookTagsState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const tags = get(normalizedTagsState)

    return book?.tags?.map(id => tags[id])
  }
})

export const bookLinksState = selectorFamily({
  key: 'bookLinksState',
  get: (bookId: string) => ({ get }) => {
    const book = get(bookState(bookId))

    return book?.links?.map(id => get(linkState(id))) || []
  }
})

export const bookCollectionsState = selectorFamily({
  key: 'bookCollectionsState',
  get: (bookId: string) => ({ get }) => {
    const book = get(bookState(bookId))

    return book?.collections?.map(id => get(collectionState(id)))
  }
})