import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common"
import { forEachUserDatabase } from "./forEachUserDatabase.js"
import type { UserDatabase } from "./listUserDatabases.js"
import { ensureUserDbIndexes } from "./userDbIndexes.js"
import { CouchService } from "./couch.service.js"

/**
 * Users rarely sign in again once they hold a refresh token, so indexes are
 * rolled out to every existing database at startup instead of on sign-in.
 * New databases get theirs at sign-up, which is the only moment a database
 * can appear between two startups.
 */
@Injectable()
export class UserDbIndexesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserDbIndexesService.name)

  constructor(private readonly couchService: CouchService) {}

  onApplicationBootstrap() {
    this.ensureOnAllUserDatabases().catch(this.logStartupFailure)
  }

  private logStartupFailure = (error: unknown) => {
    this.logger.error("Unable to ensure user db indexes at startup", error)
  }

  async ensureOnAllUserDatabases() {
    const db = await this.couchService.createAdminNanoInstance()

    this.logger.log("Ensuring indexes on the user databases")

    const ensureUserIndexes = async (
      { dbName, email }: UserDatabase,
      progress: string,
    ) => {
      const result = await ensureUserDbIndexes(db.use(dbName))

      if (result.created.length > 0) {
        this.logger.log(
          `${progress} ${email}: ${result.created.length} index(es) created`,
        )
      }

      return result
    }
    const results = await forEachUserDatabase(db, ensureUserIndexes)
    const ranOnUsers = results.length
    const indexesCreated = results.reduce(
      (total, result) => total + result.created.length,
      0,
    )
    const indexesExisting = results.reduce(
      (total, result) => total + result.existing.length,
      0,
    )

    this.logger.log(
      `Ensured user db indexes: ${ranOnUsers} users, ${indexesCreated} created, ${indexesExisting} already present`,
    )

    return { ranOnUsers, indexesCreated, indexesExisting }
  }
}
