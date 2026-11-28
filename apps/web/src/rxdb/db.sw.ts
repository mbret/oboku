import { firstValueFrom } from "rxjs"
import { createDatabase as createWebDatabase } from "./databases.shared"
import { withDatabaseLifecycleLock } from "./databaseLifecycleLock.shared"

export const createSwDatabase = () =>
  withDatabaseLifecycleLock(function openServiceWorkerDatabase() {
    return firstValueFrom(createWebDatabase({}))
  })
