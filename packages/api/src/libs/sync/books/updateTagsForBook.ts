import { addTagsToBookIfNotExist } from "@libs/couch/dbHelpers"
import { Logger } from "@libs/logger"
import type { DataSourcePlugin } from "@libs/plugins/types"
import type nano from "nano"
import type { SyncReport } from "../SyncReport"
import type { BookDocType } from "@oboku/shared"

const logger = Logger.child({ module: "sync" })

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]

/**
 * We only add new tags for now, we never remove any old tags.
 * @param tagNames use the name and lookup the id inside the method. Do not pass id.
 */
export const updateTagsForBook = async (
  book: Partial<BookDocType> & { _id: string },
  tagNames: string[],
  helpers: Helpers,
  {
    db,
    syncReport,
  }: { db: nano.DocumentScope<unknown>; syncReport: SyncReport },
) => {
  try {
    const { tags: existingTags } =
      (await helpers.findOne(`book`, {
        selector: { _id: book._id },
        fields: [`tags`],
      })) || {}

    const tags = await helpers.find(`tag`, {
      selector: { name: { $in: tagNames } },
      fields: [`_id`],
    })
    const tagIds = tags.map((tag) => tag._id)

    const someNewTagsDoesNotExistYet = tagIds?.some(
      (tag) => !existingTags?.includes(tag),
    )

    if (someNewTagsDoesNotExistYet) {
      const [bookUpdated, tagsUpdated] = await addTagsToBookIfNotExist(
        db,
        book._id,
        tagIds,
      )

      if (bookUpdated) {
        syncReport.addOrUpdateTagsToBook({
          tags: tagIds?.map((_id) => ({ _id })) ?? [],
          book,
        })
      }

      tagsUpdated?.forEach((tagUpdated) => {
        if (tagUpdated) {
          syncReport.addOrUpdateBookToTag({
            tag: { _id: tagUpdated.id },
            book,
          })
        }
      })

      Logger.info(`book ${book._id} has new tags detected and has been updated`)
    }
  } catch (e) {
    logger.error(`updateTagsForBook something went wrong for book ${book._id}`)
    logger.error(e)
  }
}
