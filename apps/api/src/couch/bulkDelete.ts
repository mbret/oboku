import type nano from "nano"

/**
 * Deletes `docs` in one bulk write, and resolves with the ids CouchDB deleted.
 * CouchDB deletes a document only at its current `_rev`: a document changed
 * since it was read stays, and its id is left out.
 */
export const bulkDelete = async <Doc extends { _id: string; _rev: string }>(
  db: Pick<nano.DocumentScope<unknown>, "bulk">,
  docs: readonly Doc[],
) => {
  const results = await db.bulk({
    // The web app validates the deletions it pulls in development, so each
    // tombstone keeps the document's fields.
    docs: docs.map((doc) => ({ ...doc, _deleted: true })),
  })

  return results
    .filter((result) => result.error === undefined)
    .map((result) => result.id)
}
