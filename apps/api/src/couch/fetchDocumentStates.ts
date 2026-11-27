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
 * Sorts `ids` by what CouchDB holds for each: a live document, or a deleted
 * one, whose tombstone CouchDB keeps. An id in neither set is one CouchDB has
 * never received, such as a document a device has not pushed yet.
 *
 * Ids are never reused, but a deleted document can come back: rxdb 17's
 * CouchDB replication pushes a device's edit to a document it finds deleted as
 * a new document. A cleanup that acts on `deletedIds` must accept that.
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
