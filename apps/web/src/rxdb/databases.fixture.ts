import { firstValueFrom } from "rxjs"
import { onTestFinished } from "vitest"
import { createDatabase } from "./databases.shared"

/**
 * Opens a real database for the running test and removes it when the test
 * finishes. Without a name, the database gets a unique one. A test can close
 * the database and open it again under the same name: Vitest runs the
 * finished hooks in reverse order, so the last instance is removed first.
 */
export const openTestDatabase = async (
  name = `test-${crypto.randomUUID()}`,
) => {
  const database = await firstValueFrom(createDatabase({ name }))

  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return database
}
