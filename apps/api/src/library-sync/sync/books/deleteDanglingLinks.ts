import type nano from "nano"
import { logger } from "./logger.js"
import type { Context } from "../types.js"
import { bulkDelete } from "../../../couch/bulkDelete.js"
import { fetchDocumentStates } from "../../../couch/fetchDocumentStates.js"
import type { LinkCandidate } from "../../../plugins/types.js"

/**
 * Deletes each link whose book CouchDB holds as deleted, records each deleted
 * link in the sync report, and resolves with the links whose book is live.
 *
 * A link whose book CouchDB has never seen stays and is not returned: a device
 * may not have pushed that book yet. A link without a book stays too and is
 * not returned. No cleanup deletes it.
 */
export const deleteDanglingLinks = async (
  {
    db,
    syncReport,
  }: Pick<Context, "syncReport"> & {
    db: Pick<nano.DocumentScope<unknown>, "fetchRevs" | "bulk">
  },
  links: LinkCandidate[],
): Promise<LinkCandidate[]> => {
  const { liveIds, deletedIds } = await fetchDocumentStates(
    db,
    links.flatMap((link) => (link.book === null ? [] : [link.book])),
  )
  const isLinkOfBookIn = (bookIds: Set<string>) =>
    function isLinkOfBook(link: LinkCandidate) {
      return link.book !== null && bookIds.has(link.book)
    }
  const linksOfDeletedBooks = links.filter(isLinkOfBookIn(deletedIds))

  if (linksOfDeletedBooks.length > 0) {
    logger.log(
      `Deleting ${linksOfDeletedBooks.length} dangling links for type ${linksOfDeletedBooks[0]?.type}`,
    )

    const deletedLinkIds = await bulkDelete(
      db,
      linksOfDeletedBooks.map(function toLinkDocument({
        isUsingSameSourceCredentials: _,
        ...link
      }) {
        return link
      }),
    )

    deletedLinkIds.forEach((linkId) => {
      syncReport.deleteLink(linkId)
    })

    const failedCount = linksOfDeletedBooks.length - deletedLinkIds.length

    if (failedCount > 0) {
      logger.warn(`CouchDB refused to delete ${failedCount} dangling links`)
    }
  }

  return links.filter(isLinkOfBookIn(liveIds))
}
