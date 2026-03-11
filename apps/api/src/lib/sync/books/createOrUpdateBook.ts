import { type BookDocType, directives } from "@oboku/shared"
import {
  type DataSourcePlugin,
  type SynchronizeAbleDataSource,
} from "src/lib/plugins/types"
import { updateTagsForBook } from "./updateTagsForBook"
import { synchronizeBookWithParentCollections } from "./synchronizeBookWithParentCollections"
import {
  addLinkToBookIfNotExist,
  addTagsToBookIfNotExist,
  atomicUpdate,
  createBook,
  findOne,
} from "src/lib/couch/dbHelpers"
import type { Context } from "../types"
import type { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"
import { deleteDanglingLinks } from "./deleteDanglingLinks"
import { logger } from "./logger"
import type { LinkCandidate } from "src/lib/plugins/types"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

/**
 * Picks the best link for the current sync from candidates that have a valid
 * book. Prefers the one using the same connector/credentials as the datasource
 * so metadata refresh can run.
 */
function getBestLinkCandidate(links: LinkCandidate[]): LinkCandidate | null {
  if (links.length === 0) return null
  return links.find((l) => l.isUsingSameProviderCredentials) ?? links[0] ?? null
}

function isFolder(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem,
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

export const createOrUpdateBook = async ({
  ctx,
  helpers,
  parents,
  item,
  coversService,
}: {
  ctx: Context
  parents: SynchronizeAbleItem[]
  item: SynchronizeAbleItem
  helpers: Helpers
  coversService: CoversService
}) => {
  const { dataSourceType, syncReport, db } = ctx

  try {
    console.log(
      `[sync.books] [createOrUpdateBook] "${item.name}":`,
      item.resourceId,
    )

    const parentTagNames = parents.reduce(
      (tags: string[], parent) => [
        ...tags,
        ...directives.extractDirectivesFromName(parent.name).tags,
      ],
      [],
    )
    const metadata = directives.extractDirectivesFromName(item.name)
    const parentFolders = parents.filter((parent) =>
      isFolder(parent),
    ) as SynchronizeAbleItem[]

    const { links: linkCandidates } = await ctx.plugin.getLinkCandidatesForItem(
      item,
      ctx,
    )

    const remainingLinks =
      linkCandidates.length > 0
        ? await deleteDanglingLinks(ctx, linkCandidates)
        : []
    const linkMatchingItem = getBestLinkCandidate(remainingLinks)

    if (!linkMatchingItem) {
      logger.log(
        `No link found for ${item.name} with resourceId ${item.resourceId}`,
      )
    }

    let existingBook: BookDocType | null = null

    if (linkMatchingItem && !linkMatchingItem.book) {
      logger.log(
        `Link found for ${item.name} with resourceId ${item.resourceId} but no book attached`,
      )
    }

    if (linkMatchingItem?.book) {
      existingBook = await helpers.findOne("book", {
        selector: { _id: linkMatchingItem.book },
      })

      if (!existingBook) {
        logger.log(`Phantom book found for link ${linkMatchingItem._id}`)
      } else {
        if (!existingBook.isAttachedToDataSource) {
          logger.log(
            `createOrUpdateBook "${item.name}": isAttachedToDataSource is false and therefore will be migrated as true`,
            existingBook._id,
          )

          await helpers.atomicUpdate("book", existingBook._id, (data) => ({
            ...data,
            isAttachedToDataSource: true,
          }))

          syncReport.updateBook(existingBook._id)
        }
      }
    }

    syncReport.upsertReference(existingBook?._id, item.name)

    if (!linkMatchingItem || !existingBook) {
      let bookId = existingBook?._id

      if (!bookId) {
        logger.log(
          `createOrUpdateBook "${item.name}": new file detected, creating book`,
        )

        const insertedBook = await createBook(db, {
          isAttachedToDataSource: true,
          metadata: [
            {
              title: item.name,
              type: "link",
            },
          ],
        })
        bookId = insertedBook.id

        syncReport.addBook(bookId, item.name)
      }

      if (!bookId) throw new Error("Book not found or not created")

      if (linkMatchingItem) {
        logger.log(
          `Update link book reference for ${item.name} with resourceId ${item.resourceId} to a valid book id`,
        )

        await atomicUpdate(ctx.db, "link", linkMatchingItem._id, (old) => ({
          ...old,
          book: bookId,
        }))

        syncReport.updateLink(linkMatchingItem._id)
      } else {
        const newlyCreatedLink = await helpers.create("link", {
          type: dataSourceType,
          resourceId: item.resourceId,
          book: bookId,
          data: item.linkData ?? null,
          createdAt: new Date().toISOString(),
          modifiedAt: null,
          rxdbMeta: {
            lwt: Date.now(),
          },
        })

        syncReport.addLink(newlyCreatedLink.id)
      }

      const bookLink = await findOne(
        "link",
        {
          selector: { book: bookId },
        },
        {
          db: ctx.db,
          throwOnNotFound: true,
        },
      )

      const addedLinkResponse = await addLinkToBookIfNotExist(
        db,
        bookId,
        bookLink._id,
      )

      if (addedLinkResponse) {
        syncReport.updateBook(bookId)
      }

      await updateTagsForBook(
        { _id: bookId },
        [...metadata.tags, ...parentTagNames],
        helpers,
        { db, syncReport },
      )

      await synchronizeBookWithParentCollections(
        { _id: bookId },
        parentFolders,
        helpers,
        ctx,
      )

      /**
       * Because it's a new book, we start a metadata refresh. When we matched an
       * existing link, only refresh if it uses the same connector/credentials as
       * the current datasource; when we created a new link we can always refresh.
       */
      const canRefreshMetadata = linkMatchingItem
        ? linkMatchingItem.isUsingSameProviderCredentials
        : true
      if (canRefreshMetadata) {
        await helpers
          .refreshBookMetadata({ bookId: bookId })
          .catch(logger.error)
      } else {
        syncReport.bookHasDifferentLink(bookId)
      }
    } else {
      /**
       * We already have a link that exist for this datasource with this book.
       * We will try to retrieve the book and update it if needed.
       */
      // We check the last updated date of the book
      const lastMetadataUpdatedAt = new Date(
        existingBook?.lastMetadataUpdatedAt || 0,
      )

      const metadataAreOlderThanModifiedDate =
        lastMetadataUpdatedAt < new Date(item.modifiedAt || 0)

      const coverObjectKey = `cover-${ctx.userNameHex}-${existingBook._id}`
      const coverExists = await firstValueFrom(
        coversService.isCoverExist(coverObjectKey),
      )
      const metadataRefreshNeeded =
        metadataAreOlderThanModifiedDate || !coverExists

      const shouldRefreshMetadata =
        linkMatchingItem.isUsingSameProviderCredentials && metadataRefreshNeeded

      if (shouldRefreshMetadata) {
        await helpers
          .refreshBookMetadata({ bookId: existingBook?._id })
          .catch(logger.error)

        console.log(
          `[sync.books] [createOrUpdateBook]`,
          `book ${
            linkMatchingItem.book
          } has changed in metadata, refresh triggered ${lastMetadataUpdatedAt} ${new Date(
            item.modifiedAt || 0,
          )}`,
        )
      } else if (
        metadataRefreshNeeded &&
        !linkMatchingItem.isUsingSameProviderCredentials
      ) {
        syncReport.bookHasDifferentLink(existingBook._id)
      }

      await synchronizeBookWithParentCollections(
        existingBook,
        parentFolders,
        helpers,
        ctx,
      )

      await updateTagsForBook(
        existingBook,
        [...metadata.tags, ...parentTagNames],
        helpers,
        { db, syncReport },
      )

      // Finally we update the tags to the book if needed
      const applyTags = item.tags ?? []

      const [bookUpdated, tagsUpdated] = await addTagsToBookIfNotExist(
        db,
        existingBook._id,
        applyTags || [],
      )

      if (bookUpdated) {
        syncReport.addOrUpdateTagsToBook({
          tags: applyTags?.map((_id) => ({ _id })) ?? [],
          book: existingBook,
        })
      }

      tagsUpdated?.forEach((tagUpdated) => {
        if (tagUpdated) {
          syncReport.addOrUpdateBookToTag({
            tag: { _id: tagUpdated.id },
            book: existingBook,
          })
        }
      })
    }

    console.log(`[createOrUpdateBook]`, `"${item.name}": DONE!`)
  } catch (e) {
    logger.error(
      `createOrUpdateBook something went wrong for book ${item.name} (${item.resourceId})`,
    )
    logger.error(e)

    throw e
  }
}
