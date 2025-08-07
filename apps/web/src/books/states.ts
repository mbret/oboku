import { intersection } from "@oboku/shared"
import { useProtectedTagIds, type useTagsByIds } from "../tags/helpers"
import { getLinkState, useLink, useLinks } from "../links/states"
import {
  getBookDownloadsState,
  type booksDownloadStateSignal,
} from "../download/states"
import { useCollections } from "../collections/useCollections"
import { map, switchMap } from "rxjs"
import { plugin as localPlugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useQuery$, useSignalValue } from "reactjrx"
import type { BookDocType, CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject, MangoQuery } from "rxdb"
import type { DeepReadonlyArray } from "rxdb/dist/types/types"
import { useMemo } from "react"
import { observeBook, observeBooks } from "./dbHelpers"
import { libraryStateSignal } from "../library/books/states"
import type { UseQueryOptions } from "@tanstack/react-query"

type UseBooksOptions = UseQueryOptions<
  DeepReadonlyObject<BookDocType>[],
  unknown,
  DeepReadonlyObject<BookDocType>[]
>

export const useBooks = ({
  queryObj = {},
  isNotInterested,
  ids,
  includeProtected: _includeProtected,
  ...options
}: {
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
  includeProtected?: boolean
} & Omit<UseBooksOptions, "queryFn" | "queryKey"> = {}) => {
  const serializedIds = JSON.stringify(ids)
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useQuery$({
    queryKey: [
      "rxdb",
      "get",
      "many",
      "books",
      { isNotInterested, serializedIds, includeProtected },
      queryObj,
    ],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          observeBooks({
            db,
            protected: includeProtected ? "with" : "none",
            ids,
            isNotInterested,
            queryObj,
          }),
        ),
        map((items) => {
          return items.map((item) => item.toJSON())
        }),
      )
    },
    ...options,
  })
}

export const useBook = ({
  id,
  enabled = true,
}: {
  id?: string
  enabled?: boolean
}) => {
  return useQuery$({
    queryKey: [`rxdb/bookJSON`, { id }],
    enabled: enabled && !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          observeBook({
            db,
            queryObj: id,
          }),
        ),
        map((value) => {
          return value?.toJSON() ?? null
        }),
      )
    },
  })
}

export type BookQueryResult = NonNullable<ReturnType<typeof useBook>["data"]>

const isBookProtected = (
  protectedTags: string[],
  book: Pick<DeepReadonlyObject<BookDocType>, "tags">,
) => intersection(protectedTags, book?.tags || []).length > 0

/**
 * @deprecated
 */
const getBookState = ({
  collections,
  book,
  tags = {},
}: {
  collections: CollectionDocType[] | undefined
  book?: BookQueryResult | null
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  if (!book) return undefined

  return {
    ...book,
    collections: book?.collections.filter(
      (id) => !!collections?.find(({ _id }) => _id === id),
    ),
    tags: book?.tags.filter((id) => !!tags[id]),
  }
}

/**
 * @deprecated
 */
export const getEnrichedBookState = ({
  protectedTagIds = [],
  tags,
  normalizedLinks,
  normalizedCollections,
  book,
  bookId,
}: {
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
  normalizedLinks: ReturnType<typeof useLinks>["data"]
  normalizedCollections: CollectionDocType[] | undefined
  book?: DeepReadonlyObject<BookDocType> | null
  bookId: string
}) => {
  const enrichedBook = getBookState({
    book,
    tags,
    collections: normalizedCollections,
  })
  const downloadState = getBookDownloadsState({
    bookId,
  })

  const linkId = enrichedBook?.links[0]

  if (!enrichedBook || !linkId) return undefined

  const firstLink = getLinkState(normalizedLinks, linkId)

  const isLocal = firstLink?.type === localPlugin.type

  return {
    ...enrichedBook,
    ...(downloadState || {}),
    isLocal,
    isProtected: isBookProtected(protectedTagIds, enrichedBook),
  }
}

export const useIsBookLocal = ({ id }: { id?: string }) => {
  const { data: book } = useBook({ id })
  const { data: link } = useLink({
    id: book?.links[0],
  })

  const isLocal = link && link?.type === localPlugin.type

  return { data: isLocal }
}

export const useIsBookProtected = (
  book?: Parameters<typeof isBookProtected>[1] | null,
) => {
  const { data: protectedTagIds, ...rest } = useProtectedTagIds({
    enabled: !!book,
  })

  return {
    ...rest,
    data:
      protectedTagIds && book
        ? isBookProtected(protectedTagIds, book)
        : undefined,
  }
}

/**
 * @deprecated
 */
export const useEnrichedBookState = ({
  bookId,
  normalizedBookDownloadsState,
  protectedTagIds,
  tags,
}: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
  tags: ReturnType<typeof useTagsByIds>["data"]
}) => {
  const { data: normalizedLinks } = useLinks()
  const { data: normalizedCollections } = useCollections()
  const { data: book } = useBook({ id: bookId })

  return useMemo(
    () =>
      getEnrichedBookState({
        book,
        bookId,
        normalizedBookDownloadsState,
        protectedTagIds,
        tags,
        normalizedLinks,
        normalizedCollections,
      }),
    [
      normalizedLinks,
      normalizedCollections,
      normalizedBookDownloadsState,
      protectedTagIds,
      tags,
      book,
      bookId,
    ],
  )
}
