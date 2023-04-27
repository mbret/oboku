import { intersection } from "ramda"
import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil"
import { BookDocType } from "@oboku/shared"
import { getLibraryState, libraryState$ } from "../library/states"
import {
  normalizedTagsState,
  protectedTagIdsState,
  protectedTags$
} from "../tags/states"
import { linkState } from "../links/states"
import {
  bookDownloadsState,
  DownloadState,
  useNormalizedBookDownloadsState
} from "../download/states"
import {
  collectionState,
  normalizedCollectionsState
} from "../collections/states"
import { map, switchMap, withLatestFrom } from "rxjs"
import { plugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

/**
 * @deprecated
 */
export type Book = NonNullable<
  UnwrapRecoilValue<typeof normalizedBooksState>[number]
>

const isBookProtected = (protectedTags: string[], book: BookDocType) =>
  intersection(protectedTags, book?.tags || []).length > 0

/**
 * @deprecated
 */
export const normalizedBooksState = atom<
  Record<string, BookDocType | undefined>
>({
  key: "books",
  default: {}
})

/**
 * @deprecated
 */
export const bookState = selectorFamily({
  key: "bookState",
  get:
    (bookId: string) =>
    ({ get }) => {
      const book = get(normalizedBooksState)[bookId]
      const tags = get(normalizedTagsState)
      const collections = get(normalizedCollectionsState)

      if (!book) return undefined

      return {
        ...book,
        collections: book?.collections.filter((id) => !!collections[id]),
        tags: book?.tags.filter((id) => !!tags[id])
      }
    }
})

/**
 * @deprecated
 */
export const enrichedBookState = selectorFamily({
  key: "enrichedBookState",
  get:
    ({
      bookId,
      normalizedBookDownloadsState
    }: {
      bookId: string
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
    }) =>
    ({ get }) => {
      const book = get(bookState(bookId))
      const downloadState = get(
        bookDownloadsState({
          bookId,
          normalizedBookDownloadsState
        })
      )
      const protectedTags = get(protectedTagIdsState)
      const linkId = book?.links[0]

      if (!book || !linkId) return undefined

      const firstLink = get(linkState(linkId))

      const isLocal = firstLink?.type === plugin.type

      return {
        ...book,
        ...(downloadState || {}),
        isLocal,
        isProtected: isBookProtected(protectedTags, book),
        // hasLink: book.links.length > 0
        canRefreshMetadata: book.links.length > 0 && !isLocal
      }
    }
})

/**
 * @deprecated
 */
export const downloadedBookWithUnsafeProtectedIdsState = selectorFamily({
  key: "downloadedBookWithUnsafeProtectedIdsState",
  get:
    ({
      normalizedBookDownloadsState
    }: {
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
    }) =>
    ({ get }) => {
      const book = get(bookIdsState)
      const downloadState = normalizedBookDownloadsState

      return book.filter(
        (id) => downloadState[id]?.downloadState === DownloadState.Downloaded
      )
    }
})

/**
 * @deprecated
 */
export const booksAsArrayState = selectorFamily({
  key: "booksAsArray",
  get:
    ({
      libraryState,
      normalizedBookDownloadsState
    }: {
      libraryState: ReturnType<typeof getLibraryState>
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
    }) =>
    ({ get }) => {
      const books = get(normalizedBooksState)
      const bookIds = get(visibleBookIdsState(libraryState))

      return bookIds.map((id) => {
        const downloadState = get(
          bookDownloadsState({ bookId: id, normalizedBookDownloadsState })
        )

        return {
          ...(books[id] as Book),
          downloadState
        }
      })
    }
})

/**
 * @deprecated
 */
export const bookIdsState = selector({
  key: "bookIdsState",
  get: ({ get }) => {
    const books = get(normalizedBooksState)

    return Object.keys(books)
  }
})

/**
 * @deprecated
 */
export const visibleBookIdsState = selectorFamily({
  key: "visibleBookIdsState",
  get:
    ({ isLibraryUnlocked }: ReturnType<typeof getLibraryState>) =>
    ({ get }) => {
      const books = get(normalizedBooksState)
      const protectedTags = get(protectedTagIdsState)

      if (isLibraryUnlocked) return Object.keys(books)

      return Object.values(books)
        .filter(
          (book) => intersection(protectedTags, book?.tags || []).length === 0
        )
        .map((book) => book?._id || "-1")
    }
})

/**
 * @deprecated
 */
export const bookTagsState = selectorFamily({
  key: "bookTagsState",
  get:
    (bookId: string) =>
    ({ get }) => {
      const book = get(normalizedBooksState)[bookId]
      const tags = get(normalizedTagsState)

      return book?.tags?.map((id) => tags[id])
    }
})

/**
 * @deprecated
 */
export const bookLinksState = selectorFamily({
  key: "bookLinksState",
  get:
    (bookId: string) =>
    ({ get }) => {
      const book = get(bookState(bookId))

      return book?.links?.map((id) => get(linkState(id))) || []
    }
})

/**
 * @deprecated
 */
export const bookCollectionsState = selectorFamily({
  key: "bookCollectionsState",
  get:
    ({
      bookId,
      libraryState
    }: {
      bookId: string
      libraryState: ReturnType<typeof getLibraryState>
    }) =>
    ({ get }) => {
      const book = get(bookState(bookId))

      return book?.collections?.map((id) =>
        get(collectionState({ id, libraryState }))
      )
    }
})

export const books$ = latestDatabase$.pipe(
  switchMap((database) => database?.book.find({}).$)
)

export const visibleBooks$ = books$.pipe(
  withLatestFrom(protectedTags$),
  withLatestFrom(libraryState$),
  map(([[books = [], protectedTags], libraryState]) =>
    books.filter(({ tags }) => {
      if (
        !libraryState.isLibraryUnlocked &&
        intersection(
          protectedTags.map(({ _id }) => _id),
          tags
        ).length
      ) {
        return false
      }

      return true
    })
  )
)
