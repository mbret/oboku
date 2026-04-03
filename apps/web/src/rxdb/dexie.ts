import Dexie, { type EntityTable } from "dexie"

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

export const dexieDb = new Dexie(`oboku-dexie`) as Dexie & {
  downloads: EntityTable<Downloads, "id">
  queryCachePersistence: EntityTable<QueryCachePersistence, "key">
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
