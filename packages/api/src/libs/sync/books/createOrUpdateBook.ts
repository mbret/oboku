import {
  BookDocType,
  GoogleDriveDataSourceData,
  directives
} from "@oboku/shared"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"
import { Logger } from "@libs/logger"
import { updateTagsForBook } from "./updateTagsForBook"
import { synchronizeBookWithParentCollections } from "./synchronizeBookWithParentCollections"
import {
  addLinkToBookIfNotExist,
  addTagsToBookIfNotExist,
  createBook
} from "@libs/couch/dbHelpers"
import { isBookCoverExist } from "@libs/books/covers/isBookCoverExist"
import { Context } from "../types"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = Logger.child({ module: "sync.books" })

function isFolder(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

export const createOrUpdateBook = async ({
  ctx,
  helpers,
  parents,
  item
}: {
  ctx: Context
  parents: (SynchronizeAbleItem | SynchronizeAbleDataSource)[]
  item: SynchronizeAbleItem
  helpers: Helpers
}) => {
  const { dataSourceType, dataSourceId, syncReport, db } = ctx
  try {
    Logger.info(`createOrUpdateBook "${item.name}":`, item.resourceId)

    const parentTagNames = parents.reduce(
      (tags: string[], parent) => [
        ...tags,
        ...directives.extractDirectivesFromName(parent.name).tags
      ],
      []
    )
    const metadata = directives.extractDirectivesFromName(item.name)
    const parentFolders = parents.filter((parent) =>
      isFolder(parent)
    ) as SynchronizeAbleItem[]

    const linkForResourceId = await helpers.findOne("link", {
      selector: { resourceId: item.resourceId }
    })

    if (linkForResourceId) {
      /**
       * We have a matching link for this item but it's not attached to dataSource.
       * We update it
       */
      if (!linkForResourceId.dataSourceId) {
        Logger.info(
          `${item.name} has a link not yet attached to any dataSource, updating it with current dataSource ${dataSourceId}`
        )

        await helpers.atomicUpdate("link", linkForResourceId._id, (old) => ({
          ...old,
          dataSourceId,
          modifiedAt: new Date().toISOString()
        }))

        syncReport.updateLink(linkForResourceId._id)
      }

      /**
       * We have a matching link for this item but it's attached to a different
       * dataSource. We will check if the dataSource actually exist, if not we
       * will attach it to this one. This help repair broken link.
       * This scenario can happen when the user delete a dataSource without deleting
       * the books associated with it.
       */
      if (
        linkForResourceId.dataSourceId &&
        linkForResourceId.dataSourceId !== dataSourceId
      ) {
        const dataSourceFoundForThisLink = await helpers.findOne("datasource", {
          selector: { _id: linkForResourceId.dataSourceId }
        })

        /**
         * If we find a dataSource, we don't need to synchronize this item
         * as it's managed by another dataSource
         */
        if (dataSourceFoundForThisLink) {
          return
        }

        Logger.info(
          `${item.name} has a link attached to a non existing dataSource, updating it with current dataSource ${dataSourceId}`
        )

        await helpers.atomicUpdate("link", linkForResourceId._id, (old) => ({
          ...old,
          dataSourceId,
          modifiedAt: new Date().toISOString()
        }))

        syncReport.updateLink(linkForResourceId._id)
      }
    }

    let existingBook: BookDocType | null = null

    if (linkForResourceId?.book) {
      existingBook = await helpers.findOne("book", {
        selector: { _id: linkForResourceId.book }
      })

      if (existingBook) {
        if (!existingBook.isAttachedToDataSource) {
          Logger.info(
            `createOrUpdateBook "${item.name}": isAttachedToDataSource is false and therefore will be migrated as true`,
            existingBook._id
          )

          await helpers.atomicUpdate("book", existingBook._id, (data) => ({
            ...data,
            isAttachedToDataSource: true
          }))

          syncReport.updateBook(existingBook._id)
        }
        // Logger.info(`createOrUpdateBook "${item.name}": existingBook`, existingBook._id)
      }
    }

    if (!linkForResourceId || !existingBook) {
      let bookId = existingBook?._id

      if (!bookId) {
        Logger.info(
          `createOrUpdateBook "${item.name}": new file detected, creating book`
        )

        const insertedBook = await createBook(db, {
          isAttachedToDataSource: true,
          metadata: [
            {
              title: item.name,
              type: "link"
            }
          ]
        })
        bookId = insertedBook.id

        syncReport.addBook(bookId)
      }

      if (!bookId) return

      const insertedLink = await helpers.create("link", {
        type: dataSourceType,
        resourceId: item.resourceId,
        book: bookId,
        data: JSON.stringify({}),
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        dataSourceId,
        rxdbMeta: {
          lwt: new Date().getTime()
        }
      })

      syncReport.addLink(insertedLink.id)

      const addedLinkResponse = await addLinkToBookIfNotExist(
        db,
        bookId,
        insertedLink.id
      )

      if (addedLinkResponse) {
        syncReport.updateBook(bookId)
      }

      await updateTagsForBook(
        { _id: bookId },
        [...metadata.tags, ...parentTagNames],
        helpers,
        { db, syncReport }
      )

      await synchronizeBookWithParentCollections(
        { _id: bookId },
        parentFolders,
        helpers,
        ctx
      )

      /**
       * Because it's a new book, we start a metadata refresh
       */
      await helpers.refreshBookMetadata({ bookId: bookId }).catch(logger.error)
    } else {
      /**
       * We already have a link that exist for this datasource with this book.
       * We will try to retrieve the book and update it if needed.
       */
      // We check the last updated date of the book
      const lastMetadataUpdatedAt = new Date(
        existingBook?.lastMetadataUpdatedAt || 0
      )

      const metadataAreOlderThanModifiedDate =
        lastMetadataUpdatedAt < new Date(item.modifiedAt || 0)

      const coverObjectKey = `cover-${ctx.userNameHex}-${existingBook._id}`

      if (
        metadataAreOlderThanModifiedDate ||
        !(await isBookCoverExist(coverObjectKey))
      ) {
        await helpers
          .refreshBookMetadata({ bookId: existingBook?._id })
          .catch(logger.error)

        Logger.info(
          `book ${
            linkForResourceId.book
          } has changed in metadata, refresh triggered ${lastMetadataUpdatedAt} ${new Date(
            item.modifiedAt || 0
          )}`
        )
      }

      await synchronizeBookWithParentCollections(
        existingBook,
        parentFolders,
        helpers,
        ctx
      )

      await updateTagsForBook(
        existingBook,
        [...metadata.tags, ...parentTagNames],
        helpers,
        { db, syncReport }
      )

      // Finally we update the tags to the book if needed
      const { applyTags } =
        await helpers.getDataSourceData<GoogleDriveDataSourceData>()

      const [bookUpdated, tagsUpdated] = await addTagsToBookIfNotExist(
        db,
        existingBook._id,
        applyTags || []
      )

      if (bookUpdated) {
        syncReport.addOrUpdateTagsToBook({
          tags: applyTags?.map((_id) => ({ _id })) ?? [],
          book: existingBook
        })
      }

      tagsUpdated?.forEach((tagUpdated) => {
        if (tagUpdated) {
          syncReport.addOrUpdateBookToTag({
            tag: { _id: tagUpdated.id },
            book: existingBook
          })
        }
      })
    }

    Logger.info(`createOrUpdateBook "${item.name}": DONE!`)
  } catch (e) {
    logger.error(
      `createOrUpdateBook something went wrong for book ${item.name} (${item.resourceId})`
    )
    logger.error(e)

    throw e
  }
}
