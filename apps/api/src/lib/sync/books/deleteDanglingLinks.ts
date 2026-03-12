import { exists } from "src/lib/couch/exists"
import { logger } from "./logger"
import { Context } from "../types"
import { bulkDelete } from "src/lib/couch/bulkDelete"
import type { LinkCandidate } from "src/lib/plugins/types"

/**
 * Deletes dangling links for a resource: links that have no book or whose book
 * no longer exists in the DB (phantom book). Links that have a valid book are
 * never touched, so the user keeps all valid access paths.
 *
 * Steps:
 * 1. For each link, if it has no book or the book does not exist in the DB,
 *    mark it for deletion.
 * 2. Log and record in the sync report each link to delete, then bulk-delete
 *    them from the DB.
 * 3. Return the links that were not deleted (all have a valid book). The
 *    caller is responsible for choosing which one to use for the current sync
 *    (e.g. prefer same connector for metadata refresh).
 */
export const deleteDanglingLinks = async (
  ctx: Context,
  links: LinkCandidate[],
): Promise<LinkCandidate[]> => {
  const toDelete: LinkCandidate[] = []

  for (const link of links) {
    if (!link.book) {
      toDelete.push(link)
      continue
    }
    const bookExists = await exists(ctx.db, link.book)
    if (!bookExists) {
      toDelete.push(link)
    }
  }

  if (toDelete.length) {
    logger.log(
      `Deleting ${toDelete.length} dangling links for resourceId ${toDelete[0]?.resourceId}`,
    )

    toDelete.forEach((link) => {
      ctx.syncReport.deleteLink(link._id)
    })

    await bulkDelete(ctx.db, toDelete)
  }

  return links.filter((link) => !toDelete.includes(link))
}
