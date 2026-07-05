import Dexie, { type EntityTable, type PromiseExtended } from "dexie"
import type { Profile } from "../profiles/types"
import type { StoredProofKey } from "../auth/proofKey"

/**
 * Persist the original filename alongside the binary payload because:
 * - the reader uses filenames as a signal for archive handling and directives
 * - blobs restored from IndexedDB may not retain the original file metadata
 */
interface Downloads {
  id: string
  data: Blob | File
  filename: string
}

interface QueryCachePersistence {
  key: string
  value: unknown
}

/**
 * Registry of everything stored in the `keyValue` table. Adding an entry here
 * is all that is needed for `dexieDb.keyValue.get/put` to be typed for that
 * key. Values that outlive an app version must still be validated at runtime
 * by their consumer — the type only reflects what the current build writes.
 */
interface KeyValueMap {
  "auth.proofKey.current": StoredProofKey
}

type KeyValueEntry = {
  [Key in keyof KeyValueMap]: { key: Key; value: KeyValueMap[Key] }
}[keyof KeyValueMap]

type KeyValueTable = Omit<EntityTable<KeyValueEntry, "key">, "get" | "put"> & {
  get<Key extends keyof KeyValueMap>(
    key: Key,
  ): PromiseExtended<{ key: Key; value: KeyValueMap[Key] } | undefined>
  put<Key extends keyof KeyValueMap>(entry: {
    key: Key
    value: KeyValueMap[Key]
  }): PromiseExtended<Key>
}

export const dexieDb = new Dexie(`oboku-dexie`) as Dexie & {
  downloads: EntityTable<Downloads, "id">
  queryCachePersistence: EntityTable<QueryCachePersistence, "key">
  keyValue: KeyValueTable
  profiles: EntityTable<Profile, "id">
}

dexieDb.version(1).stores({
  downloads: `++id, data, name`,
})

dexieDb.version(2).stores({
  downloads: `++id, data`,
})

dexieDb
  .version(3)
  .stores({
    downloads: `++id, data, filename`,
  })
  .upgrade((tx) => {
    return tx
      .table("downloads")
      .toCollection()
      .modify((download) => {
        if (
          typeof download.filename !== "string" &&
          typeof download.name === "string"
        ) {
          download.filename = download.name
        }

        if (!(typeof download.filename === "string")) {
          download.filename = "unknown"
        }

        delete download.name
      })
  })

dexieDb.version(4).stores({
  downloads: `++id, data, filename`,
  queryCachePersistence: `&key`,
})

dexieDb.version(5).stores({
  downloads: `++id, data, filename`,
  queryCachePersistence: `&key`,
  profiles: `&id`,
})

dexieDb.version(6).stores({
  downloads: `++id, data, filename`,
  queryCachePersistence: `&key`,
  profiles: `&id`,
  keyValue: `&key`,
})
