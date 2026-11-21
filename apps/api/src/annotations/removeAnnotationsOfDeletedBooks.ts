import type { AnnotationDocType } from "@oboku/shared"
import type createNano from "nano"
import { findAll, retryFn } from "../couch/dbHelpers.js"

type FetchRow = Awaited<
  ReturnType<createNano.DocumentScope<AnnotationDocType>["fetch"]>
>["rows"][number]

const isDeletedDocumentRow = (row: FetchRow) =>
  "value" in row && "deleted" in row.value && row.value.deleted === true

/**
 * Removes the annotations whose book CouchDB holds as deleted, and resolves
 * with how many it removed. An annotation whose book CouchDB has never seen
 * stays: that book may still be waiting to sync on a device.
 *
 * A deleted book never comes back: book ids are random UUIDs, and the
 * replication keeps CouchDB's version when a device edits a book that another
 * device deleted. A feature that restores deleted books must stop this
 * cleanup.
 */
export const removeAnnotationsOfDeletedBooks = async (
  db: Pick<
    createNano.DocumentScope<AnnotationDocType>,
    "find" | "fetch" | "bulk"
  >,
) => {
  const annotations = await findAll(db, {
    selector: { rx_model: "annotation" },
  })
  const bookIds = [
    ...new Set(annotations.map((annotation) => annotation.bookId)),
  ]

  if (bookIds.length === 0) return 0

  const { rows } = await retryFn(() => db.fetch({ keys: bookIds }))
  const deletedBookIds = new Set(
    rows.filter(isDeletedDocumentRow).map((row) => row.key),
  )
  const annotationsOfDeletedBooks = annotations.filter((annotation) =>
    deletedBookIds.has(annotation.bookId),
  )

  if (annotationsOfDeletedBooks.length === 0) return 0

  const results = await db.bulk({
    // The web app validates the deletions it pulls in development, so the
    // tombstone keeps the annotation's required fields.
    docs: annotationsOfDeletedBooks.map((annotation) => ({
      ...annotation,
      _deleted: true,
    })),
  })

  return results.filter((result) => result.error === undefined).length
}
