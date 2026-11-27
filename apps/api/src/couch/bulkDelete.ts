import type nano from "nano"
import { bulkUpdate } from "./bulkUpdate.js"

/**
 * Deletes `docs` in one bulk write, and resolves with the ids CouchDB deleted.
 * CouchDB deletes a document only at its current `_rev`: a document changed
 * since it was read stays, and its id is left out.
 */
export const bulkDelete = <Doc extends { _id: string; _rev: string }>(
  db: Pick<nano.DocumentScope<unknown>, "bulk">,
  docs: readonly Doc[],
) =>
  bulkUpdate(
    db,
    // The web app validates the deletions it pulls in development, so each
    // tombstone keeps the document's fields.
    docs.map((doc) => ({ ...doc, _deleted: true })),
  )
