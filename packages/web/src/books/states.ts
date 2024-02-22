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
  normalizedBookDownloadsStateSignal,
  DownloadState
} from "../download/states"
import { getCollectionState, useCollections } from "../collections/states"
import { map, switchMap, withLatestFrom } from "rxjs"
import { plugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useLocalSettingsState } from "../settings/states"
import { useForeverQuery } from "reactjrx"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { useMemo } from "react"

export const getBooksByIds = async (database: Database) => {
  const result = await database.collections.book.find({}).exec()

  return keyBy(result, "_id")
}

export const useBooks = () => {
  return useForeverQuery({
    queryKey: ["db", "get", "many", "books"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.book.find({}).$),
        map((entries) => keyBy(entries, "_id"))
      )
    }
  })
}

export const useBook = ({ id }: { id?: string }) => {
  return useForeverQuery({
    queryKey: ["book", id],
    enabled: !!id,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap(
          (db) =>
            db.collections.book.findOne({
              selector: {
                _id: id
              }
            }).$
        ),
        map((value) => value?.toJSON())
      )
  })
}

export type BookQueryResult = NonNullable<ReturnType<typeof useBook>["data"]>

const isBookProtected = (protectedTags: string[], book: BookQueryResult) =>
  intersection(protectedTags, book?.tags || []).length > 0

/**
 * @deprecated
 */
const getBookState = ({
  collections = {},
  book,
  tags = {}
}: {
  collections: ReturnType<typeof useCollections>["data"]
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
  bookId: string
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: book } = useBook({ id: bookId })
  const { data: collections } = useCollections()

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
    typeof normalizedBookDownloadsStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
  normalizedLinks: ReturnType<typeof useLinks>["data"]
  normalizedCollections: ReturnType<typeof useCollections>["data"]
  normalizedBooks: ReturnType<typeof useBooks>["data"]
}) => {
  const book = getBookState({
    book: normalizedBooks[bookId]?.toJSON(),
    tags,
    collections: normalizedCollections
  })
  const downloadState = getBookDownloadsState({
    bookId,
    normalizedBookDownloadsState
  })

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

export const useEnrichedBookState = (param: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof normalizedBookDownloadsStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: normalizedLinks } = useLinks()
  const { data: normalizedCollections } = useCollections()
  const { data: normalizedBooks } = useBooks()

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
    typeof normalizedBookDownloadsStateSignal.getValue
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
  libraryState,
  normalizedBookDownloadsState,
  protectedTagIds = []
}: {
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  normalizedBookDownloadsState: ReturnType<
    typeof normalizedBookDownloadsStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
}) => {
  const { data: books = {}, isPending } = useBooks()
  const visibleBookIds = useVisibleBookIdsState({
    libraryState,
    protectedTagIds
  })

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
          ...book.toJSON(),
          downloadState
        }
      ]
    }, bookResult),
    isPending
  }
}

export const useBookIdsState = () => {
  const { data: books = {} } = useBooks()

  return Object.keys(books)
}

/**
 * @deprecated
 */
export const useVisibleBookIdsState = ({
  libraryState: { isLibraryUnlocked },
  protectedTagIds = []
}: {
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
}) => {
  const { data: books = {} } = useBooks()

  return useMemo(() => {
    if (isLibraryUnlocked) {
      return Object.keys(books)
    } else {
      return Object.values(books)
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
  localSettingsState: ReturnType<typeof useLocalSettingsState>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const book = useBookState({ bookId, tags })
  const { data: normalizedCollections } = useCollections()
  const bookIds = useVisibleBookIdsState({
    libraryState,
    protectedTagIds
  })

  return book?.collections?.map((id) =>
    getCollectionState({
      id,
      localSettingsState,
      normalizedCollections,
      bookIds
    })
  )
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
