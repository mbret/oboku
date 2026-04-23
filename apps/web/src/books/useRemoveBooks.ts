import type { LinkDocType } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { OfflineError } from "../errors/errors.shared"
import type {
  RemoveResourceGroup,
  RemoveResourceGroupHandler,
} from "../plugins/usePluginRemoveResource"
import { usePluginRemoveResource } from "../plugins/usePluginRemoveResource"
import type { Database } from "../rxdb"
import { useDatabase } from "../rxdb"

export type RemoveBookMode = "library-only" | "library-and-source"

export type RemoveBooksPayload = {
  bookIds: readonly string[]
  mode?: RemoveBookMode
}

type RemoteBookRemovalGroup = Omit<RemoveResourceGroup, "links"> & {
  bookIds: string[]
  links: LinkDocType[]
}

type RemoveDownload = ReturnType<typeof useRemoveDownloadFile>["mutateAsync"]

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false

const getUniqueValues = <T>(values: readonly T[]) => Array.from(new Set(values))

const getRemoteBookRemovalGroups = async ({
  bookIds,
  db,
}: {
  bookIds: readonly string[]
  db: Database
}) => {
  const booksById = await db.book.findByIds(Array.from(bookIds)).exec()
  const bookLinkIds = bookIds.map((bookId) => {
    const book = booksById.get(bookId)

    if (!book) {
      throw new Error(`Book ${bookId} not found`)
    }

    const linkId = book.links[0]

    if (!linkId) {
      throw new Error(`Link not found for book ${bookId}`)
    }

    return {
      bookId,
      linkId,
    }
  })
  const linksById = await db.link
    .findByIds(getUniqueValues(bookLinkIds.map(({ linkId }) => linkId)))
    .exec()
  const groups = new Map<LinkDocType["type"], RemoteBookRemovalGroup>()

  for (const { bookId, linkId } of bookLinkIds) {
    const link = linksById.get(linkId)

    if (!link) {
      throw new Error(`Link ${linkId} not found`)
    }

    const group = groups.get(link.type)

    if (!group) {
      groups.set(link.type, {
        type: link.type,
        bookIds: [bookId],
        links: [link],
      })
      continue
    }

    group.bookIds.push(bookId)

    if (!group.links.some((item) => item._id === link._id)) {
      group.links.push(link)
    }
  }

  return Array.from(groups.values())
}

const removeBooksLocally = async ({
  bookIds,
  db,
  removeDownload,
}: {
  bookIds: readonly string[]
  db: Database
  removeDownload: RemoveDownload
}) => {
  if (bookIds.length === 0) {
    return []
  }

  const uniqueBookIds = getUniqueValues(bookIds)
  const booksById = await db.book.findByIds(uniqueBookIds).exec()
  return Promise.all(
    uniqueBookIds.map(async (bookId) => {
      const book = booksById.get(bookId)

      if (!book) {
        throw new Error(`Book ${bookId} not found`)
      }

      await book.incrementalRemove()
      await removeDownload({ bookId })
    }),
  )
}

const removeBooks = async ({
  bookIds,
  mode,
  db,
  removeDownload,
  removeResourceGroup,
}: {
  bookIds: readonly string[]
  mode: RemoveBookMode
  db: Database
  removeDownload: RemoveDownload
  removeResourceGroup: RemoveResourceGroupHandler
}) => {
  const uniqueBookIds = getUniqueValues(bookIds)
  const bookIdsEligibleForLocalRemoval =
    mode === "library-only" ? [...uniqueBookIds] : []
  let hasRemoteError = false

  if (mode === "library-and-source") {
    const remoteGroups = await getRemoteBookRemovalGroups({
      bookIds: uniqueBookIds,
      db,
    })
    const remoteGroupResults = await Promise.allSettled(
      remoteGroups.map(async (group) => ({
        group,
        result: await removeResourceGroup({
          links: group.links,
          type: group.type,
        }),
      })),
    )

    for (const remoteGroupResult of remoteGroupResults) {
      if (remoteGroupResult.status === "rejected") {
        hasRemoteError = true
        continue
      }

      const { group, result } = remoteGroupResult.value

      if ("isError" in result) {
        hasRemoteError = true
        continue
      }

      bookIdsEligibleForLocalRemoval.push(...group.bookIds)
    }
  }

  await removeBooksLocally({
    bookIds: bookIdsEligibleForLocalRemoval,
    db,
    removeDownload,
  })

  if (hasRemoteError) {
    throw new Error("Failed to remove one or more remote resources")
  }
}

export const useRemoveBooks = () => {
  const { mutateAsync: removeDownload } = useRemoveDownloadFile()
  const { mutateAsync: removeResourceGroup } = usePluginRemoveResource()
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async (payload: RemoveBooksPayload) => {
      if (!db) {
        throw new Error("Database not found")
      }

      const mode = payload.mode ?? "library-only"

      if (mode === "library-and-source" && isOffline()) {
        throw new OfflineError()
      }

      return removeBooks({
        bookIds: payload.bookIds,
        mode,
        db,
        removeDownload,
        removeResourceGroup,
      })
    },
  })
}
