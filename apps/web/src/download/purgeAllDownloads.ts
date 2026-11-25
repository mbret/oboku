import { dexieDb } from "../rxdb/dexie"

export const purgeAllDownloads = async () => {
  await dexieDb.downloads.clear()
}
