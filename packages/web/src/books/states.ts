import { intersection } from "lodash"
import { libraryStateSignal } from "../library/states"
import {
  protectedTags$,
  useProtectedTagIds,
  useTagsByIds
} from "../tags/helpers"
import { getLinkState, useLinks } from "../links/states"
import {
  getBookDownloadsState,
  booksDownloadStateSignal,
  DownloadState
} from "../download/states"
import {
  useCollections,
  useCollectionsDictionary
} from "../collections/states"
import { map, switchMap, withLatestFrom } from "rxjs"
import { plugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useLocalSettings } from "../settings/states"
import { useForeverQuery, useSignalValue } from "reactjrx"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { useMemo } from "react"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject, MangoQuery } from "rxdb"

export const getBooksByIds = async (database: Database) => {
  const result = await database.collections.book.find({}).exec()

  return keyBy(
    result.map((book) => book.toJSON()),
    "_id"
  )
}

export const useBooks = ({
  queryObj
}: { queryObj?: MangoQuery<BookDocType> } = {}) => {
  return useForeverQuery({
    queryKey: ["rxdb", "get", "many", "books", queryObj],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.book.find(queryObj).$),
        map((items) => items.map((item) => item.toJSON()))
      )
    }
  })
}

export const useBooksDic = () => {
  const { data, ...rest } = useBooks()

  return { ...rest, data: data ? keyBy(data, "_id") : undefined }
}

export const useBook = ({ id }: { id?: string }) => {
  return useForeverQuery({
    queryKey: ["rxdb", "book", id],
    enabled: !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap(
          (db) =>
            db.book.findOne({
              selector: {
                _id: id
              }
            }).$
        ),
        map((value) => {
          return value?.toJSON() ?? null
        })
      )
    }
  })
}

export type BookQueryResult = NonNullable<ReturnType<typeof useBook>["data"]>

const isBookProtected = (
  protectedTags: string[],
  book: Pick<DeepReadonlyObject<BookDocType>, "tags">
) => intersection(protectedTags, book?.tags || []).length > 0

/**
 * @deprecated
 */
const getBookState = ({
  collections = {},
  book,
  tags = {}
}: {
  collections: ReturnType<typeof useCollectionsDictionary>["data"]
  book?: BookQueryResult | null
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  if (!book) return undefined

  return {
    ...book,
    collections: book?.collections.filter((id) => !!collections[id]),
    tags: book?.tags.filter((id) => !!tags[id])
  }
}

/**
 * @deprecated
 */
export const useBookState = ({
  bookId,
  tags = {}
}: {
  bookId?: string
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: book } = useBook({ id: bookId })
  const { data: collections } = useCollectionsDictionary()

  return getBookState({
    book,
    collections,
    tags
  })
}

/**
 * @deprecated
 */
export const getEnrichedBookState = ({
  bookId,
  normalizedBookDownloadsState,
  protectedTagIds = [],
  tags,
  normalizedLinks,
  normalizedCollections,
  normalizedBooks = {}
}: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
  normalizedLinks: ReturnType<typeof useLinks>["data"]
  normalizedCollections: Omit<ReturnType<typeof useCollectionsDictionary>["data"], "displayableName">
  normalizedBooks: ReturnType<typeof useBooksDic>["data"]
}) => {
  const book = getBookState({
    book: normalizedBooks[bookId],
    tags,
    collections: normalizedCollections
  })
  const downloadState = getBookDownloadsState({
    bookId,
    normalizedBookDownloadsState
  })

  if (book && !book?.links) {
    debugger
  }
  const linkId = book?.links[0]

  if (!book || !linkId) return undefined

  const firstLink = getLinkState(normalizedLinks, linkId)

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

export const useIsBookProtected = (
  book?: Parameters<typeof isBookProtected>[1] | null
) => {
  const { data: protectedTagIds, ...rest } = useProtectedTagIds({
    enabled: !!book
  })

  return {
    ...rest,
    data:
      protectedTagIds && book
        ? isBookProtected(protectedTagIds, book)
        : undefined
  }
}

/**
 * @deprecated
 */
export const useEnrichedBookState = (param: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: normalizedLinks } = useLinks()
  const { data: normalizedCollections = {} } = useCollectionsDictionary()
  const { data: normalizedBooks } = useBooksDic()

  return getEnrichedBookState({
    ...param,
    normalizedLinks,
    normalizedCollections,
    normalizedBooks
  })
}

/**
 * @deprecated
 */
export const useDownloadedBookWithUnsafeProtectedIdsState = ({
  normalizedBookDownloadsState
}: {
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
}) => {
  const book = useBookIdsState()
  const downloadState = normalizedBookDownloadsState

  return book.filter(
    (id) => downloadState[id]?.downloadState === DownloadState.Downloaded
  )
}

/**
 * @deprecated
 */
export const useBooksAsArrayState = ({
  normalizedBookDownloadsState
}: {
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
}) => {
  const { data: books = {}, isPending } = useBooksDic()
  const visibleBookIds = useVisibleBookIds()

  const bookResult: (BookQueryResult & {
    downloadState: ReturnType<typeof getBookDownloadsState>
  })[] = []

  return {
    data: visibleBookIds.reduce((acc, id) => {
      const downloadState = getBookDownloadsState({
        bookId: id,
        normalizedBookDownloadsState
      })

      const book = books[id]

      if (!book) return acc

      return [
        ...acc,
        {
          ...book,
          downloadState
        }
      ]
    }, bookResult),
    isPending
  }
}

export const useBookIdsState = () => {
  const { data: books = {} } = useBooksDic()

  return Object.keys(books)
}

export const useVisibleBookIds = ({
  queryObj
}: { queryObj?: MangoQuery<BookDocType> } = {}) => {
  const { data: books = [] } = useBooks({ queryObj })
  const { data: protectedTagIds } = useProtectedTagIds()
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useMemo(() => {
    if (isLibraryUnlocked) {
      return books.map((item) => item._id)
    } else {
      return books
        .filter(
          (book) => intersection(protectedTagIds, book?.tags || []).length === 0
        )
        .map((book) => book?._id || "-1")
    }
  }, [books, protectedTagIds, isLibraryUnlocked])
}

/**
 * @deprecated
 */
export const useBookTagsState = ({
  bookId,
  tags = {}
}: {
  bookId: string
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: book } = useBook({ id: bookId })

  return book?.tags?.map((id) => tags[id])
}

/**
 * @deprecated
 */
export const useBookLinksState = ({
  bookId,
  tags
}: {
  bookId: string
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const book = useBookState({ bookId, tags })
  const { data: links } = useLinks()

  return book?.links?.map((id) => getLinkState(links, id)) || []
}

/**
 * @deprecated
 */
export const useBookCollectionsState = ({
  bookId,
  libraryState,
  localSettingsState,
  protectedTagIds = [],
  tags
}: {
  bookId: string
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  localSettingsState: ReturnType<typeof useLocalSettings>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const book = useBookState({ bookId, tags })
  const { data: normalizedCollections } = useCollectionsDictionary()
  const bookIds = useVisibleBookIds()

  return useCollections({
    queryObj: {
      selector: {
        _id: {
          $in: book?.collections ?? []
        }
      }
    }
  })
}

// export const useBookCollectionsState = ({
//   bookId,
//   libraryState,
//   localSettingsState,
//   protectedTagIds,
//   tags
// }: {
//   bookId: string
//   libraryState: ReturnType<typeof libraryStateSignal.getValue>
//   localSettingsState: ReturnType<typeof useLocalSettingsState>
//   protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
//   tags: ReturnType<typeof useTagsByIds>["data"]
// }) => {
//   const book = useRecoilValue(bookState({ bookId, tags }))

//   return book?.collections?.map((id) =>
//     get(
//       collectionState({
//         id,
//         libraryState,
//         localSettingsState,
//         protectedTagIds
//       })
//     )
//   )
// }

export const books$ = latestDatabase$.pipe(
  switchMap((database) => database?.book.find({}).$)
)

export const visibleBooks$ = books$.pipe(
  withLatestFrom(protectedTags$),
  withLatestFrom(libraryStateSignal.subject),
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
