import type createNano from "nano"
import { retryFn } from "./dbHelpers"

type UserDbIndexDefinition = {
  name: string
  fields: readonly string[]
}

/**
 * Mango indexes every per-user database should carry.
 *
 * CouchDB uses a JSON index only when every one of its fields appears in the
 * selector, so `rx_model` alone serves the queries that filter on model only
 * and each composite index serves the selectors that also constrain its
 * second field. Without them every `_find` scans the whole database.
 *
 * Each index lives in its own design document so adding one later never
 * invalidates the others.
 *
 * Never assume an index is present or ready. They are rolled out best-effort:
 * `UserDbIndexesService` creates them at startup and sign-up fires the same
 * pass without awaiting it, and both only log on failure. A database can
 * therefore lack an index for a while, or forever if CouchDB rejects the
 * creation, and CouchDB builds a JSON index on the first query that uses it
 * rather than when `POST /_index` returns, so the first indexed query on a
 * large database can take seconds.
 *
 * Consequences for queries against user databases:
 * - A plain selector is always safe: without a usable index CouchDB falls back
 *   to scanning `_all_docs`, which is slower but correct.
 * - A `sort` is only safe once the index it needs exists. CouchDB answers a
 *   sort without a matching index with a 400, so a sorted query must call
 *   {@link ensureUserDbIndexes} first (or tolerate the 400) instead of
 *   trusting the rollout.
 * - Adding an entry here makes it reach existing databases at the next
 *   startup, not at deploy time, and never before the code that relies on it.
 */
export const USER_DB_INDEXES: readonly UserDbIndexDefinition[] = [
  { name: "rx_model", fields: ["rx_model"] },
  { name: "rx_model-createdAt", fields: ["rx_model", "createdAt"] },
  { name: "rx_model-type", fields: ["rx_model", "type"] },
  { name: "rx_model-linkType", fields: ["rx_model", "linkType"] },
]

export type EnsureUserDbIndexesResult = {
  created: string[]
  existing: string[]
}

const toDesignDocName = (indexName: string) => `idx-${indexName}`

/**
 * Creates every index from {@link USER_DB_INDEXES} that the database does not
 * already have. Idempotent: CouchDB reports an identical existing index as
 * `exists` instead of creating a duplicate.
 */
export const ensureUserDbIndexes = async (
  db: Pick<createNano.DocumentScope<unknown>, "createIndex">,
): Promise<EnsureUserDbIndexesResult> => {
  const result: EnsureUserDbIndexesResult = { created: [], existing: [] }

  for (const index of USER_DB_INDEXES) {
    const response = await retryFn(function createIndexOnce() {
      return db.createIndex({
        index: { fields: [...index.fields] },
        name: index.name,
        ddoc: toDesignDocName(index.name),
        type: "json",
      })
    })

    if (response.result === "created") {
      result.created.push(index.name)
    } else {
      result.existing.push(index.name)
    }
  }

  return result
}
