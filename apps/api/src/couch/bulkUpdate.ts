import type nano from "nano"

/**
 * Writes `docs` in one bulk write, and resolves with the ids CouchDB wrote.
 * CouchDB writes a document only at its current `_rev`: a document changed
 * since it was read stays as it is, and its id is left out.
 */
export const bulkUpdate = async <Doc extends { _id: string; _rev: string }>(
  db: Pick<nano.DocumentScope<unknown>, "bulk">,
  docs: readonly Doc[],
) => {
  const results = await db.bulk({ docs: [...docs] })

  return results
    .filter((result) => result.error === undefined)
    .map((result) => result.id)
}
