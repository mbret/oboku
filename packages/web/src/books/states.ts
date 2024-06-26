import { intersection } from "lodash"
import { useProtectedTagIds, useTagsByIds } from "../tags/helpers"
import { getLinkState, useLink, useLinks } from "../links/states"
import {
  getBookDownloadsState,
  booksDownloadStateSignal,
  DownloadState
} from "../download/states"
import { useCollectionsDictionary } from "../collections/states"
import { from, map, switchMap } from "rxjs"
import { plugin as localPlugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { isDefined, useForeverQuery, useQuery } from "reactjrx"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject, MangoQuery } from "rxdb"
import { useVisibleBooks } from "./useVisibleBooks"
import { DeepReadonlyArray } from "rxdb/dist/types/types"

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
  ids
}: {
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
} = {}) => {
  const serializedIds = JSON.stringify(ids)

  return useForeverQuery({
    queryKey: [
      "rxdb",
      "get",
      "many",
      "books",
      { isNotInterested, serializedIds },
      queryObj
    ],
    queryFn: () => {
      const finalQueryObj = {
        ...queryObj,
        selector: {
          ...queryObj.selector,
          ...(isNotInterested === "none" && {
            isNotInterested: {
              $ne: true
            }
          }),
          ...(isNotInterested === "only" && {
            isNotInterested: {
              $eq: true
            }
          }),
          ...(ids && {
            _id: {
              $in: ids
            }
          })
        }
      } satisfies MangoQuery<BookDocType>

      return latestDatabase$.pipe(
        switchMap((db) => db.collections.book.find(finalQueryObj).$),
        map((items) => items.map((item) => item.toJSON()))
      )
    }
  })
}

export const useBooksDic = () => {
  const { data, ...rest } = useBooks()

  return { ...rest, data: data ? keyBy(data, "_id") : undefined }
}

export const useBook = ({
  id,
  enabled = true
}: {
  id?: string
  enabled?: boolean
}) => {
  return useForeverQuery({
    queryKey: ["rxdb", "book", { id }],
    enabled: enabled && !!id,
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
  normalizedCollections: Omit<
    ReturnType<typeof useCollectionsDictionary>["data"],
    "displayableName"
  >
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
  const visibleBookIds = useVisibleBookIds() ?? []

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

export const useVisibleBookIds = (
  params: Parameters<typeof useVisibleBooks>[0] = {}
) => {
  return useVisibleBooks(params).data?.map((book) => book._id)
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

  return book?.tags?.map((id) => tags[id]).filter(isDefined)
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

export const books$ = latestDatabase$.pipe(
  switchMap((database) => database?.book.find({}).$)
)

