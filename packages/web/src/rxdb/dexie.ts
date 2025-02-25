import Dexie, { EntityTable } from "dexie"

interface Downloads {
  id: string
  name: string
  data: Blob | File
}

export const dexieDb = new Dexie(`oboku-dexie`) as Dexie & {
  downloads: EntityTable<Downloads, "id">
}

dexieDb.version(1).stores({
  downloads: `++id, data, name`,
})
