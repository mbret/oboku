import type createNano from "nano"
import { bulkDelete } from "../couch/bulkDelete.js"
import { findAll } from "../couch/dbHelpers.js"
import { fetchDocumentStates } from "../couch/fetchDocumentStates.js"

/**
 * Deletes the documents of `model` whose book CouchDB holds as deleted, and
 * resolves with how many it deleted. A document whose book CouchDB has never
 * seen stays: that book may still be waiting to sync on a device. A document
 * without a book stays too.
 *
 * A feature that restores deleted books must stop this cleanup.
 */
export const deleteDocumentsOfDeletedBooks = async <
  Doc extends { _id: string; _rev: string; rx_model: string },
>(
  db: Pick<createNano.DocumentScope<Doc>, "find" | "fetchRevs" | "bulk">,
  {
    model,
    getBookId,
  }: {
    model: Doc["rx_model"]
    getBookId: (doc: Doc) => string | null
  },
) => {
  const docs = await findAll(db, { selector: { rx_model: model } })
  const { deletedIds: deletedBookIds } = await fetchDocumentStates(
    db,
    docs.flatMap(function toBookId(doc) {
      const bookId = getBookId(doc)

      return bookId === null ? [] : [bookId]
    }),
  )
  const docsOfDeletedBooks = docs.filter(function isOfDeletedBook(doc) {
    const bookId = getBookId(doc)

    return bookId !== null && deletedBookIds.has(bookId)
  })

  if (docsOfDeletedBooks.length === 0) return 0

  const deletedIds = await bulkDelete(db, docsOfDeletedBooks)

  return deletedIds.length
}
