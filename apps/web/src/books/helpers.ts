import {
  compareDesc,
  createBookDefaults,
  getReadingStateUpdatedTime,
  sortByTitleComparator,
} from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { Logger } from "../debug/logger.shared"
import { useMemo } from "react"
import type { BookQueryResult } from "./states"
import { getMetadataFromBook } from "./metadata"
import { useRefreshBookMetadata } from "./useRefreshBookMetadata"
import { type UseMutationOptions, useMutation } from "@tanstack/react-query"
import { useMutation$ } from "reactjrx"
import { combineLatest, from } from "rxjs"
import { useCollectionIncrementalUpdate } from "../collections/useCollectionIncrementalUpdate"
import { useIncrementalBookUpdate } from "./useIncrementalBookUpdate"

const withoutGlobalErrorToast = { meta: { suppressGlobalErrorToast: true } }

export const useRemoveTagFromBook = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const { db } = useDatabase()

  return useMutation({
    ...options,
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } }),
  })
}

export const useAddTagToBook = (options?: Pick<UseMutationOptions, "meta">) => {
  const { db } = useDatabase()

  return useMutation({
    ...options,
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $push: { tags: tagId } }),
  })
}

export const useAddCollectionToBook = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const { mutateAsync: updateBook } = useIncrementalBookUpdate(
    withoutGlobalErrorToast,
  )
  const { mutateAsync: updateCollection } = useCollectionIncrementalUpdate(
    withoutGlobalErrorToast,
  )

  return useMutation$({
    ...options,
    mutationFn: ({
      _id,
      collectionId,
    }: {
      _id: string
      collectionId: string
    }) => {
      const updateBook$ = from(
        updateBook({
          doc: _id,
          updateObj: {
            $addToSet: { collections: collectionId },
          },
        }),
      )

      const updateCollection$ = from(
        updateCollection({
          doc: collectionId,
          updateObj: {
            $addToSet: { books: _id },
          },
        }),
      )

      return combineLatest([updateBook$, updateCollection$])
    },
  })
}

export const useRemoveCollectionFromBook = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const { mutateAsync: updateBook } = useIncrementalBookUpdate(
    withoutGlobalErrorToast,
  )
  const { mutateAsync: updateCollection } = useCollectionIncrementalUpdate(
    withoutGlobalErrorToast,
  )

  return useMutation$({
    ...options,
    mutationFn: ({
      _id,
      collectionId,
    }: {
      _id: string
      collectionId: string
    }) => {
      const updateBook$ = from(
        updateBook({
          doc: _id,
          updateObj: {
            $pullAll: { collections: [collectionId] },
          },
        }),
      )

      const updateCollection$ = from(
        updateCollection({
          doc: collectionId,
          updateObj: {
            $pullAll: { books: [_id] },
          },
        }),
      )

      return combineLatest([updateBook$, updateCollection$])
    },
  })
}

export const useAddBook = () => {
  const { db: database } = useDatabase()
  const refreshMetadata = useRefreshBookMetadata()

  const addBook = async ({
    book,
    link,
    skipMetadataRefresh = false,
  }: {
    book?: Partial<Parameters<NonNullable<typeof database>["book"]["post"]>[0]>
    link: Parameters<NonNullable<typeof database>["link"]["safeInsert"]>[0]
    skipMetadataRefresh?: boolean
  }) => {
    try {
      if (database) {
        const linkToInsert = {
          ...link,
          data: link.type === "URI" ? (link.data ?? {}) : (link.data ?? null),
        }
        const linkAdded = await database.link.safeInsert(linkToInsert)

        const { tags, ...rest } = book || {}
        const newBook = await database.book.post({
          ...createBookDefaults(),
          tags: tags || [],
          links: [linkAdded.primary],
          ...rest,
        })

        if (!skipMetadataRefresh) {
          refreshMetadata(newBook._id)
        }

        return { book: newBook, link: linkAdded }
      }
    } catch (e) {
      Logger.error(e)
    }
  }

  return [addBook] as [typeof addBook]
}

export const useBooksSortedBy = (
  books: BookQueryResult[] | undefined,
  sorting: "date" | "activity" | "alpha" | undefined,
) => {
  return useMemo(() => sortBooksBy(books ?? [], sorting), [books, sorting])
}

export const sortBooksBy = (
  books: BookQueryResult[],
  sorting: "date" | "activity" | "alpha" | undefined,
) => {
  switch (sorting) {
    case "date": {
      return [...books].sort((a, b) => compareDesc(a.createdAt, b.createdAt))
    }
    case "activity": {
      return [...books].sort(function compareByLatestReadingActivity(a, b) {
        const aTime = getReadingStateUpdatedTime(a)
        const bTime = getReadingStateUpdatedTime(b)

        if (aTime === undefined) return 1
        if (bTime === undefined) return -1

        return bTime - aTime
      })
    }
    case "alpha": {
      return books
        .map((book) => ({
          book,
          title: getMetadataFromBook(book).title?.toString() ?? "",
        }))
        .sort((a, b) => sortByTitleComparator(a.title, b.title))
        .map(({ book }) => book)
    }
    default:
      return books
  }
}
