import { liveQuery } from "dexie"
import { from } from "rxjs"
import { dexieDb } from "../rxdb/dexie"

/**
 * The downloads stored on the device, again after each change to them,
 * including the changes of other tabs.
 */
export const observeStoredDownloads = () =>
  from(
    liveQuery(function listStoredDownloads() {
      return dexieDb.downloads.toArray()
    }),
  )
