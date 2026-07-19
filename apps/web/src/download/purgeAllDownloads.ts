import { dexieDb } from "../rxdb/dexie"
import { booksDownloadStateSignal } from "./states"

export const purgeAllDownloads = async () => {
  await dexieDb.downloads.clear()

  booksDownloadStateSignal.setValue({})
}
