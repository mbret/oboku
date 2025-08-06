import { LinkDocType } from "@oboku/shared"
import { exists } from "src/lib/couch/exists"
import { logger } from "./logger"
import { Context } from "../types"
import { bulkDelete } from "src/lib/couch/bulkDelete"

/**
 * When synchronizing a book, we take the chance to delete dangling links.
 * A dangling link is a link that is not attached to a book or has a phantom book.
 * It is safe to do during sync process because we are gonna upsert the book afterwards.
 * It would be unsafe otherwise due to the async nature of db state.
 *
 * @issue
 * - A user delete a book but the link remains -> phantom book. During sync we will find a link but not a book.
 */
export const cleanAndMergeBookLinks = async (
  ctx: Context,
  links: LinkDocType[],
) => {
  const { toDelete, toKeep } = await links.reduce(
    async (
      promise: Promise<{ toDelete: LinkDocType[]; toKeep: LinkDocType | null }>,
      link,
    ) => {
      const acc = await promise
      const hasAlreadyValidLink = acc.toKeep

      if (!hasAlreadyValidLink && link.book) {
        const bookExists = await exists(ctx.db, link.book)

        if (bookExists) {
          return {
            ...acc,
            toKeep: link,
          }
        }
      }

      return {
        ...acc,
        toDelete: [...acc.toDelete, link],
      }
    },
    Promise.resolve({ toDelete: [], toKeep: null }),
  )

  if (toDelete.length) {
    logger.log(
      `Deleting ${toDelete.length} links for resourceId ${toDelete[0]?.resourceId}`,
    )

    toDelete.forEach((link) => {
      ctx.syncReport.deleteLink(link.resourceId)
    })

    await bulkDelete(ctx.db, toDelete)
  }

  return toKeep
}
