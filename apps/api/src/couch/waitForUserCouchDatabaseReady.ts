import type createNano from "nano"
import { isCouchNotFound } from "./dbHelpers"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * After a new `_users` row, couch_peruser creates `userdb-…` asynchronously.
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
    try {
      await server.db.get(dbName)
      return
    } catch (error) {
      if (!isCouchNotFound(error)) throw error
    }
    await sleep(intervalMs)
  }

  throw new Error(
    `CouchDB user database "${dbName}" was not created by couch_peruser before the deadline`,
  )
}
