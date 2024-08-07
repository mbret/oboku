import { intersection } from "lodash"
import { useProtectedTagIds, useTagsByIds } from "../tags/helpers"
import { getLinkState, useLink, useLinksDic } from "../links/states"
import {
  getBookDownloadsState,
  booksDownloadStateSignal
} from "../download/states"
import { useCollections } from "../collections/useCollections"
import { map, switchMap } from "rxjs"
import { plugin as localPlugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useForeverQuery, useSignalValue } from "reactjrx"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { BookDocType, CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject, MangoQuery } from "rxdb"
import { DeepReadonlyArray } from "rxdb/dist/types/types"
import { useMemo } from "react"
import { observeBook, observeBooks } from "./dbHelpers"
import { libraryStateSignal } from "../library/states"

export const getBooksByIds = async (database: Database) => {
  const result = await database.collections.book.find({}).exec()

  return keyBy(
    result.map((book) => book.toJSON()),
    "_id"
  )
}

export const useBooks = ({
  queryObj = {},
  isNotInterested,
  ids,
  includeProtected: _includeProtected
}: {
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
  includeProtected?: boolean
} = {}) => {
  const serializedIds = JSON.stringify(ids)
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useForeverQuery({
    queryKey: [
      "rxdb",
      "get",
      "many",
      "books",
      { isNotInterested, serializedIds, includeProtected },
      queryObj
    ],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          observeBooks({
            db,
            includeProtected,
            ids,
            isNotInterested,
            queryObj
          })
        ),
        map((items) => items.map((item) => item.toJSON()))
      )
  })
}

export const useBooksDic = () => {
  const { data, ...rest } = useBooks()

  const transformedData = useMemo(
    () => (data ? keyBy(data, "_id") : undefined),
    [data]
  )

  return { ...rest, data: transformedData }
}

export const useBookDoc = ({
  id,
  enabled = true
}: {
  id?: string
  enabled?: boolean
}) => {
  return useForeverQuery({
    queryKey: [`rxdb/bookDoc`, { id }],
    enabled: enabled && !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          observeBook({
            db,
            queryObj: id
          })
        )
      )
    }
  })
}

export const useBook = ({
  id,
  enabled = true
}: {
  id?: string
  enabled?: boolean
}) => {
  return useForeverQuery({
    queryKey: [`rxdb/bookJSON`, { id }],
    enabled: enabled && !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          observeBook({
            db,
            queryObj: id
          })
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
  collections,
  book,
  tags = {}
}: {
  collections: CollectionDocType[] | undefined
  book?: BookQueryResult | null
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  if (!book) return undefined

  return {
    ...book,
    collections: book?.collections.filter(
      (id) => !!collections?.find(({ _id }) => _id === id)
    ),
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
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
  normalizedLinks: ReturnType<typeof useLinksDic>["data"]
  normalizedCollections: CollectionDocType[] | undefined
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

  const linkId = book?.links[0]

  if (!book || !linkId) return undefined

  const firstLink = getLinkState(normalizedLinks, linkId)

  const isLocal = firstLink?.type === localPlugin.type

  return {
    ...book,
    ...(downloadState || {}),
    isLocal,
    isProtected: isBookProtected(protectedTagIds, book)
  }
}

export const useIsBookLocal = ({ id }: { id?: string }) => {
  const { data: book } = useBook({ id })
  const { data: link } = useLink({
    id: book?.links[0]
  })

  const isLocal = link && link?.type === localPlugin.type

  return { data: isLocal }
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
export const useEnrichedBookState = ({
  bookId,
  normalizedBookDownloadsState,
  protectedTagIds,
  tags
}: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: normalizedLinks } = useLinksDic()
  const { data: normalizedCollections } = useCollections()
  const { data: normalizedBooks } = useBooksDic()

  return useMemo(
    () =>
      getEnrichedBookState({
        bookId,
        normalizedBookDownloadsState,
        protectedTagIds,
        tags,
        normalizedLinks,
        normalizedCollections,
        normalizedBooks
      }),
    [
      normalizedLinks,
      normalizedCollections,
      normalizedBooks,
      bookId,
      normalizedBookDownloadsState,
      protectedTagIds,
      tags
    ]
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
  const { data: visibleBooks } = useBooks()
  const visibleBookIds = useMemo(
    () => visibleBooks?.map((item) => item._id) ?? [],
    [visibleBooks]
  )

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
  const { data: links } = useLinksDic()

  return book?.links?.map((id) => getLinkState(links, id)) || []
}

export const books$ = latestDatabase$.pipe(
  switchMap((database) => database?.book.find({}).$)
)
