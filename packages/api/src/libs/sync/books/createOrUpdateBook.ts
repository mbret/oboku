import {
  BookDocType,
  GoogleDriveDataSourceData,
  directives
} from "@oboku/shared"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"
import nano from "nano"
import { Logger } from "@libs/logger"
import { updateTagsForBook } from "./updateTagsForBook"
import { synchronizeBookWithParentCollections } from "./synchronizeBookWithParentCollections"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0] & {
  db: nano.DocumentScope<unknown>
}
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = Logger.namespace("sync.books")

function isFolder(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

export const createOrUpdateBook = async ({
  ctx: { dataSourceType, dataSourceId },
  helpers,
  parents,
  item
}: {
  ctx: Context
  parents: (SynchronizeAbleItem | SynchronizeAbleDataSource)[]
  item: SynchronizeAbleItem
  helpers: Helpers
}) => {
  try {
    logger.log(`createOrUpdateBook "${item.name}":`, item.resourceId)

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
        logger.log(
          `${item.name} has a link not yet attached to any dataSource, updating it with current dataSource ${dataSourceId}`
        )

        await helpers.atomicUpdate("link", linkForResourceId._id, (old) => ({
          ...old,
          dataSourceId,
          modifiedAt: new Date().toISOString()
        }))
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

        logger.log(
          `${item.name} has a link attached to a non existing dataSource, updating it with current dataSource ${dataSourceId}`
        )

        await helpers.atomicUpdate("link", linkForResourceId._id, (old) => ({
          ...old,
          dataSourceId,
          modifiedAt: new Date().toISOString()
        }))
      }
    }

    let existingBook: BookDocType | null = null

    if (linkForResourceId?.book) {
      existingBook = await helpers.findOne("book", {
        selector: { _id: linkForResourceId.book }
      })

      if (existingBook) {
        if (!existingBook.isAttachedToDataSource) {
          logger.log(
            `createOrUpdateBook "${item.name}": isAttachedToDataSource is false and therefore will be migrated as true`,
            existingBook._id
          )
          await helpers.atomicUpdate("book", existingBook._id, (data) => ({
            ...data,
            isAttachedToDataSource: true
          }))
        }
        // logger.log(`createOrUpdateBook "${item.name}": existingBook`, existingBook._id)
      }
    }

    if (!linkForResourceId || !existingBook) {
      let bookId = existingBook?._id

      if (!bookId) {
        logger.log(
          `createOrUpdateBook "${item.name}": new file detected, creating book`
        )
        const insertedBook = await helpers.createBook({
          isAttachedToDataSource: true,
          metadata: [
            {
              title: item.name,
              type: "link"
            }
          ]
        })
        bookId = insertedBook.id
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
      await helpers.addLinkToBook(bookId, insertedLink.id)
      await updateTagsForBook(
        bookId,
        [...metadata.tags, ...parentTagNames],
        helpers
      )
      await synchronizeBookWithParentCollections(bookId, parentFolders, helpers)

      /**
       * Because it's a new book, we start a metadata refresh
       */
      helpers.refreshBookMetadata({ bookId: bookId }).catch(logger.error)
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

      if (
        metadataAreOlderThanModifiedDate ||
        !(await helpers.isBookCoverExist(existingBook._id))
      ) {
        helpers
          .refreshBookMetadata({ bookId: existingBook?._id })
          .catch(logger.error)

        logger.log(
          `book ${
            linkForResourceId.book
          } has changed in metadata, refresh triggered ${lastMetadataUpdatedAt} ${new Date(
            item.modifiedAt || 0
          )}`
        )
      }

      await synchronizeBookWithParentCollections(
        existingBook._id,
        parentFolders,
        helpers
      )

      await updateTagsForBook(
        existingBook._id,
        [...metadata.tags, ...parentTagNames],
        helpers
      )

      // Finally we update the tags to the book if needed
      const { applyTags } =
        await helpers.getDataSourceData<GoogleDriveDataSourceData>()
      await helpers.addTagsToBook(existingBook._id, applyTags || [])
    }

    logger.log(`createOrUpdateBook "${item.name}": DONE!`)
  } catch (e) {
    logger.error(
      `createOrUpdateBook something went wrong for book ${item.name} (${item.resourceId})`
    )
    logger.error(e)

    throw e
  }
}
