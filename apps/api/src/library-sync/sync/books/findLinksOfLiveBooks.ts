import type nano from "nano"
import { fetchDocumentStates } from "../../../couch/fetchDocumentStates.js"
import type { LinkCandidate } from "../../../plugins/types.js"

/**
 * Resolves with the links whose book CouchDB holds as live: the links the sync
 * may use. It changes no link. A link without a book, or whose book is deleted
 * or never reached CouchDB, is left out.
 */
export const findLinksOfLiveBooks = async (
  db: Pick<nano.DocumentScope<unknown>, "fetchRevs">,
  links: LinkCandidate[],
) => {
  const { liveIds } = await fetchDocumentStates(
    db,
    links.flatMap((link) => (link.book === null ? [] : [link.book])),
  )

  return links.filter(function isLinkOfLiveBook(link) {
    return link.book !== null && liveIds.has(link.book)
  })
}
