import { directives } from "@oboku/shared"
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
import { createOrUpdateBook } from "./books/createOrUpdateBook"

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
