import type createNano from "nano"
import { doesCouchDatabaseExist } from "./dbHelpers"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * After a `_users` row is written, couch_peruser creates `userdb-…` asynchronously.
 * Poll until it exists so the client does not replicate against a missing DB.
 *
 * @param options.deadline - Absolute time limit in ms (same epoch as `Date.now()`).
 */
export const waitForUserCouchDatabaseReady = async (
  server: createNano.ServerScope,
  dbName: string,
  options: { deadline: number; intervalMs?: number },
) => {
  const { deadline, intervalMs = 80 } = options

  while (Date.now() < deadline) {
    if (await doesCouchDatabaseExist(server, dbName)) return
    await sleep(intervalMs)
  }

  throw new Error(
    `CouchDB user database "${dbName}" was not created by couch_peruser before the deadline. Check that couch_peruser is enabled with delete_dbs=true on your CouchDB, and look for couch_peruser_sup restarts in its log`,
  )
}
