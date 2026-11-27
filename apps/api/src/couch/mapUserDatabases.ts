import type createNano from "nano"
import { listUserDatabases, type UserDatabase } from "./listUserDatabases.js"
import { tolerateMissingUserDb } from "./tolerateMissingUserDb.js"

/**
 * Runs `step` on every user database, one after the other, and returns the
 * result of each step. A database that disappears during the run gives no
 * result. `progress` reads `[3/12]`, for the step's logs.
 */
export const mapUserDatabases = async <T extends NonNullable<unknown>>(
  db: createNano.ServerScope,
  step: (userDatabase: UserDatabase, progress: string) => Promise<T>,
) => {
  const userDatabases = await listUserDatabases(db)
  const results: T[] = []

  for (const [index, userDatabase] of userDatabases.entries()) {
    const progress = `[${index + 1}/${userDatabases.length}]`
    const result = await tolerateMissingUserDb(
      userDatabase.email,
      function runStepOnUserDatabase() {
        return step(userDatabase, progress)
      },
    )

    if (result !== null) results.push(result)
  }

  return results
}
