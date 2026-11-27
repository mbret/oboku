import type createNano from "nano"
import { retryFn } from "./dbHelpers.js"

type FetchRevsRow = Awaited<
  ReturnType<createNano.DocumentScope<unknown>["fetchRevs"]>
>["rows"][number]

const isDeletedDocumentRow = (row: FetchRevsRow) =>
  "value" in row && "deleted" in row.value && row.value.deleted === true

const isLiveDocumentRow = (row: FetchRevsRow) =>
  "value" in row && !isDeletedDocumentRow(row)

/**
 * Resolves with the ids of `ids` that CouchDB holds as live documents
 * (`liveIds`) and as deleted ones (`deletedIds`). An id in neither set is one
 * CouchDB has never received, such as a document a device has not pushed yet.
 *
 * Ids are never reused, but a deleted document can come back. When a device
 * edits a document that CouchDB holds as deleted, rxdb 17's CouchDB
 * replication pushes the edit as a new document. A cleanup that acts on
 * `deletedIds` must accept that.
 */
export const fetchDocumentStates = async (
  db: Pick<createNano.DocumentScope<unknown>, "fetchRevs">,
  ids: Iterable<string>,
) => {
  const keys = [...new Set(ids)]

  if (keys.length === 0) {
    return { liveIds: new Set<string>(), deletedIds: new Set<string>() }
  }

  const { rows } = await retryFn(() => db.fetchRevs({ keys }))

  return {
    liveIds: new Set(rows.filter(isLiveDocumentRow).map((row) => row.key)),
    deletedIds: new Set(
      rows.filter(isDeletedDocumentRow).map((row) => row.key),
    ),
  }
}
