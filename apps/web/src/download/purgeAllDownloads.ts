import { dexieDb } from "../rxdb/dexie"
import { downloadsBroadcast } from "./downloadsBroadcast"
import { booksDownloadStateSignal } from "./states"

export const purgeAllDownloads = async () => {
  await dexieDb.downloads.clear()

  booksDownloadStateSignal.update({})
  downloadsBroadcast.broadcast("downloads-changed")
}
