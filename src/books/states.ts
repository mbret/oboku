import { intersection } from "ramda";
import { atom, selector, selectorFamily } from "recoil";
import { BookDocType } from "../databases";
import { libraryState } from "../library/states";
import { normalizedTagsState, protectedTagIdsState } from "../tags/states";
import { normalizedLinksState } from "../links/states";

export const normalizedBooksState = atom<Record<string, BookDocType | undefined>>({
  key: 'books',
  default: {}
})

export const booksAsArrayState = selector<BookDocType[]>({
  key: 'booksAsArray',
  get: ({ get }) => {
    const books = get(normalizedBooksState)
    const bookIds = get(bookIdsState)

    return bookIds.map(id => books[id] as BookDocType)
  }
})

export const bookIdsState = selector({
  key: 'bookIds',
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
    const book = get(normalizedBooksState)[bookId]
    const links = get(normalizedLinksState)

    return book?.links?.map(id => links[id])
  }
})