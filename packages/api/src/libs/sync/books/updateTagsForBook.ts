import { Logger } from "@libs/logger"
import { DataSourcePlugin } from "@libs/plugins/types"

const logger = Logger.namespace("sync")

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]

/**
 * We only add new tags for now, we never remove any old tags.
 * @param tagNames use the name and lookup the id inside the method. Do not pass id.
 */
export const updateTagsForBook = async (
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
