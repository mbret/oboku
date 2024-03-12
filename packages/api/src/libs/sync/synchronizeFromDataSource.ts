import {
  BookDocType,
  GoogleDriveDataSourceData,
  directives
} from "@oboku/shared"
import { createHelpers } from "../plugins/helpers"
import { uniq } from "lodash"
import { Logger } from "@libs/logger"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"
import { registerOrUpdateCollection } from "./collections/registerOrUpdateCollection"
import { createTagFromName } from "@libs/couch/dbHelpers"
import nano from "nano"

const logger = Logger.namespace("sync")

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0] & {
  db: nano.DocumentScope<unknown>
}
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

function isFolder(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

function isFile(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "file"
}

export const synchronizeFromDataSource = async (
  synchronizeAble: SynchronizeAbleDataSource,
  ctx: Context & { authorization: string; db: nano.DocumentScope<unknown> },
  helpers: ReturnType<typeof createHelpers>
) => {
  console.log(
    `dataSourcesSync run for user ${ctx.userName} with dataSource ${ctx.dataSourceId}`
  )

  await syncTags({
    ctx,
    helpers,
    item: synchronizeAble,
    hasCollectionAsParent: false,
    lvl: 0,
    parents: []
  })

  await syncFolder({
    ctx,
    helpers,
    item: synchronizeAble,
    hasCollectionAsParent: false,
    lvl: 0,
    parents: []
  })
}

const getItemTags = (
  item: SynchronizeAbleDataSource | SynchronizeAbleItem,
  helpers: Helpers
): string[] => {
  const metadataForFolder = directives.extractDirectivesFromName(item.name)

  const subTagsAsMap = (item.items || []).map((subItem) => {
    return getItemTags(subItem, helpers)
  })

  const subTags = subTagsAsMap.reduce((acc, tags) => [...acc, ...tags], [])

  return [...metadataForFolder.tags, ...subTags]
}

/**
 * We first go through all folders and items and create the tags. This way we avoid concurrent tags creation and we can later
 * easily retrieve tags ids.
 */
const syncTags = async ({
  helpers,
  item,
  lvl,
  ctx
}: {
  ctx: Context
  helpers: Helpers
  lvl: number
  hasCollectionAsParent: boolean
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
  parents: (SynchronizeAbleItem | SynchronizeAbleDataSource)[]
}) => {
  console.log(`syncTags for item ${item.name} and lvl ${lvl}`)

  const tagNames = uniq(getItemTags(item, helpers))

  console.log(`found ${tagNames.length} tags`)

  await Promise.all(
    tagNames.map(async (tag) => {
      const { created, id } = await createTagFromName(ctx.db, tag, true)
      if (created) {
        logger.log(`syncTags ${tag} created with id ${id}`)
      }
    })
  )
}

const syncFolder = async ({
  ctx,
  helpers,
  hasCollectionAsParent,
  item,
  lvl,
  parents
}: {
  ctx: Context & { authorization: string }
  helpers: Helpers
  lvl: number
  hasCollectionAsParent: boolean
  item: SynchronizeAbleDataSource | SynchronizeAbleItem
  parents: (SynchronizeAbleItem | SynchronizeAbleDataSource)[]
}) => {
  const metadataForFolder = directives.extractDirectivesFromName(item.name)
  logger.log(`syncFolder ${item.name}: metadata `, metadataForFolder)

  const isCollection =
    isFolder(item) &&
    !hasCollectionAsParent &&
    lvl > 0 &&
    !metadataForFolder.isNotACollection

  if (metadataForFolder.isIgnored) {
    logger.log(`syncFolder ${item.name}: ignored!`)
    return
  }

  await Promise.all(
    metadataForFolder.tags.map((name) => helpers.getOrCreateTagFromName(name))
  )

  // Do not register as collection if
  // - root
  // - metadata says otherwise
  // - parent is not already a collection
  if (isFolder(item) && isCollection) {
    await registerOrUpdateCollection({ ctx, item, helpers })
  }

  logger.log(
    `syncFolder ${item.name}: with items ${item.items?.length || 0} items`
  )

  await Promise.all(
    (item.items || []).map(async (subItem) => {
      if (isFile(subItem)) {
        await createOrUpdateBook({
          ctx,
          item: subItem,
          helpers,
          parents: [...parents, item]
        })
      } else if (isFolder(subItem)) {
        await syncFolder({
          ctx,
          helpers,
          lvl: lvl + 1,
          hasCollectionAsParent: isCollection,
          item: subItem,
          parents: [...parents, item]
        })
      }
    })
  )

  logger.log(`syncFolder ${item.name} DONE!`)
}

const createOrUpdateBook = async ({
  ctx: { dataSourceType },
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
    const existingLink = await helpers.findOne("link", {
      selector: { resourceId: item.resourceId }
    })

    // logger.log(`createOrUpdateBook "${item.name}": existingLink`, existingLink?._id)

    let existingBook: BookDocType | null = null
    if (existingLink?.book) {
      existingBook = await helpers.findOne("book", {
        selector: { _id: existingLink.book }
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

    if (!existingLink || !existingBook) {
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
            existingLink.book
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

/**
 * We only add new tags for now, we never remove any old tags.
 * @param tagNames use the name and lookup the id inside the method. Do not pass id.
 */
const updateTagsForBook = async (
  bookId: string,
  tagNames: string[],
  helpers: Helpers
) => {
  try {
    const { tags: existingTags } =
      (await helpers.findOne(`book`, {
        selector: { _id: bookId },
        fields: [`tags`]
      })) || {}

    const tags = await helpers.find(`tag`, {
      selector: { name: { $in: tagNames } },
      fields: [`_id`]
    })
    const tagIds = tags.map((tag) => tag._id)

    const someNewTagsDoesNotExistYet = tagIds?.some(
      (tag) => !existingTags?.includes(tag)
    )
    if (someNewTagsDoesNotExistYet) {
      await helpers.addTagsToBook(bookId, tagIds)
      logger.log(`book ${bookId} has new tags detected and has been updated`)
    }
  } catch (e) {
    logger.error(`updateTagsForBook something went wrong for book ${bookId}`)
    logger.error(e)
  }
}

/**
 * For every parents of the book we will lookup if there are collections that exist without
 * referencing it. If so then we will attach the collection and the book together
 */
const synchronizeBookWithParentCollections = async (
  bookId: string,
  parents: SynchronizeAbleItem[],
  helpers: Helpers
) => {
  const parentResourceIds = parents?.map((parent) => parent.resourceId) || []

  logger.log(
    `synchronizeBookWithParentCollections`,
    `${bookId} with ${parentResourceIds.length} parentResourceIds ${parentResourceIds}`
  )

  // Retrieve all the new collection to which attach the book and add the book in the list
  // if there is no collection we don't run the query since it will return everything because of the empty $or
  if (parentResourceIds.length > 0) {
    /**
     * Use case:
     * Some collections does not have the book yet
     *
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const collectionsThatHaveNotThisBookAsReferenceYet = await helpers.find(
      "obokucollection",
      {
        selector: {
          $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId })),
          books: {
            $nin: [bookId]
          }
        }
      }
    )

    if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
      logger.log(
        `synchronizeBookWithParentCollections ${collectionsThatHaveNotThisBookAsReferenceYet.length} collections does not have ${bookId} attached to them yet`
      )
      await Promise.all(
        collectionsThatHaveNotThisBookAsReferenceYet.map((collection) =>
          helpers.atomicUpdate("obokucollection", collection._id, (old) => ({
            ...old,
            books: [...old.books.filter((id) => id !== bookId), bookId]
          }))
        )
      )
    }

    const parentCollections = await helpers.find("obokucollection", {
      selector: {
        $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId }))
      }
    })
    const parentCollectionIds = parentCollections.map(({ _id }) => _id)

    /**
     * Use case:
     * The book does not have one of the parent collection yet
     *
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const { collections: bookCollections } =
      (await helpers.findOne("book", {
        selector: { _id: bookId },
        fields: [`collections`]
      })) || {}

    if (bookCollections) {
      const bookHasNotOneOfTheCollectionsYet = parentCollectionIds.some(
        (collectionId) => !bookCollections.includes(collectionId)
      )
      if (bookHasNotOneOfTheCollectionsYet) {
        logger.log(
          `synchronizeBookWithParentCollections ${bookId} has some missing parent collections. It will be updated to include them`
        )
        await helpers.atomicUpdate("book", bookId, (old) => ({
          ...old,
          collections: [
            ...new Set([...old.collections, ...parentCollectionIds])
          ]
        }))
      }
    }
  }

  /**
   * Use case:
   * The book does not have parent collections
   *
   * Result:
   * We do not remove collection yet. See for the future
   */
  if (parentResourceIds.length === 0) {
    // @todo remove collections from the book ?
  }
}
