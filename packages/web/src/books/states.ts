import { intersection } from "ramda"
import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil"
import { BookDocType } from "@oboku/shared"
import { getLibraryState, libraryState$ } from "../library/states"
import {
  protectedTags$,
  useProtectedTagIds,
  useTagsByIds
} from "../tags/helpers"
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
import { useLocalSettingsState } from "../settings/states"

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
    ({
      bookId,
      tags = {}
    }: {
      bookId: string
      tags: ReturnType<typeof useTagsByIds>["data"]
    }) =>
    ({ get }) => {
      const book = get(normalizedBooksState)[bookId]
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
      normalizedBookDownloadsState,
      protectedTagIds = [],
      tags
    }: {
      bookId: string
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
      protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
      tags: ReturnType<typeof useTagsByIds>["data"]
    }) =>
    ({ get }) => {
      const book = get(bookState({ bookId, tags }))
      const downloadState = get(
        bookDownloadsState({
          bookId,
          normalizedBookDownloadsState
        })
      )
      const linkId = book?.links[0]

      if (!book || !linkId) return undefined

      const firstLink = get(linkState(linkId))

      const isLocal = firstLink?.type === plugin.type

      return {
        ...book,
        ...(downloadState || {}),
        isLocal,
        isProtected: isBookProtected(protectedTagIds, book),
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
      normalizedBookDownloadsState,
      protectedTagIds = []
    }: {
      libraryState: ReturnType<typeof getLibraryState>
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
      protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
    }) =>
    ({ get }) => {
      const books = get(normalizedBooksState)
      const bookIds = get(
        visibleBookIdsState({ libraryState, protectedTagIds })
      )

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
    ({
      libraryState: { isLibraryUnlocked },
      protectedTagIds = []
    }: {
      libraryState: ReturnType<typeof getLibraryState>
      protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
    }) =>
    ({ get }) => {
      const books = get(normalizedBooksState)

      if (isLibraryUnlocked) return Object.keys(books)

      return Object.values(books)
        .filter(
          (book) => intersection(protectedTagIds, book?.tags || []).length === 0
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
    ({
      bookId,
      tags = {}
    }: {
      bookId: string
      tags: ReturnType<typeof useTagsByIds>["data"]
    }) =>
    ({ get }) => {
      const book = get(normalizedBooksState)[bookId]

      return book?.tags?.map((id) => tags[id])
    }
})

/**
 * @deprecated
 */
export const bookLinksState = selectorFamily({
  key: "bookLinksState",
  get:
    ({
      bookId,
      tags
    }: {
      bookId: string
      tags: ReturnType<typeof useTagsByIds>["data"]
    }) =>
    ({ get }) => {
      const book = get(bookState({ bookId, tags }))

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
      libraryState,
      localSettingsState,
      protectedTagIds = [],
      tags
    }: {
      bookId: string
      libraryState: ReturnType<typeof getLibraryState>
      localSettingsState: ReturnType<typeof useLocalSettingsState>
      protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
      tags: ReturnType<typeof useTagsByIds>["data"]
    }) =>
    ({ get }) => {
      const book = get(bookState({ bookId, tags }))

      return book?.collections?.map((id) =>
        get(
          collectionState({
            id,
            libraryState,
            localSettingsState,
            protectedTagIds
          })
        )
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
