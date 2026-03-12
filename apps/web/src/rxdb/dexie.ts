import Dexie, { type EntityTable } from "dexie"

interface Downloads {
  id: string
  data: Blob | File
}

export const dexieDb = new Dexie(`oboku-dexie`) as Dexie & {
  downloads: EntityTable<Downloads, "id">
}

dexieDb
  .version(2)
  .stores({
    downloads: `++id, data`,
  })
  .upgrade((tx) => {
    return tx
      .table("downloads")
      .toCollection()
      .modify((download) => {
        delete download.name
      })
  })

dexieDb.version(1).stores({
  downloads: `++id, data, name`,
})
