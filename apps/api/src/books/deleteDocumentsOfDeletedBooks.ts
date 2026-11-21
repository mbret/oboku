import type createNano from "nano"
import { bulkDelete } from "../couch/bulkDelete.js"
import { findAll, retryFn } from "../couch/dbHelpers.js"

type FetchRow = Awaited<
  ReturnType<createNano.DocumentScope<unknown>["fetch"]>
>["rows"][number]

const isDeletedDocumentRow = (row: FetchRow) =>
  "value" in row && "deleted" in row.value && row.value.deleted === true

/**
 * Deletes the documents of `model` whose book CouchDB holds as deleted, and
 * resolves with how many it deleted. A document whose book CouchDB has never
 * seen stays: that book may still be waiting to sync on a device. A document
 * without a book stays too.
 *
 * This assumes a deleted book is never restored: book ids are never reused,
 * and the replication keeps CouchDB's deleted version when a device edits a
 * book that another device deleted. A feature that restores deleted books must
 * stop this cleanup.
 */
export const deleteDocumentsOfDeletedBooks = async <
  Doc extends { _id: string; _rev: string; rx_model: string },
>(
  db: Pick<createNano.DocumentScope<Doc>, "find" | "fetch" | "bulk">,
  {
    model,
    getBookId,
  }: {
    model: Doc["rx_model"]
    getBookId: (doc: Doc) => string | null
  },
) => {
  const docs = await findAll(db, { selector: { rx_model: model } })
  const bookIds = [
    ...new Set(
      docs.flatMap(function toBookId(doc) {
        const bookId = getBookId(doc)

        return bookId === null ? [] : [bookId]
      }),
    ),
  ]

  if (bookIds.length === 0) return 0

  const { rows } = await retryFn(() => db.fetch({ keys: bookIds }))
  const deletedBookIds = new Set(
    rows.filter(isDeletedDocumentRow).map((row) => row.key),
  )
  const docsOfDeletedBooks = docs.filter(function isOfDeletedBook(doc) {
    const bookId = getBookId(doc)

    return bookId !== null && deletedBookIds.has(bookId)
  })

  if (docsOfDeletedBooks.length === 0) return 0

  const deletedIds = await bulkDelete(db, docsOfDeletedBooks)

  return deletedIds.length
}
