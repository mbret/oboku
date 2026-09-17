import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common"
import { listUserDatabases } from "src/lib/couch/listUserDatabases"
import { tolerateMissingUserDb } from "src/lib/couch/tolerateMissingUserDb"
import { ensureUserDbIndexes } from "src/lib/couch/userDbIndexes"
import { CouchService } from "./couch.service"

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
    const userDbs = await listUserDatabases(db)

    this.logger.log(`Ensuring indexes on ${userDbs.length} user databases`)

    let ranOnUsers = 0
    let indexesCreated = 0
    let indexesExisting = 0

    for (let i = 0; i < userDbs.length; i++) {
      const userEntry = userDbs[i]
      if (!userEntry) continue
      const { dbName, email } = userEntry
      const progress = `[${i + 1}/${userDbs.length}]`

      await tolerateMissingUserDb(email, async () => {
        const result = await ensureUserDbIndexes(db.use(dbName))

        ranOnUsers++
        indexesCreated += result.created.length
        indexesExisting += result.existing.length

        if (result.created.length > 0) {
          this.logger.log(
            `${progress} ${email}: ${result.created.length} index(es) created`,
          )
        }
      })
    }

    this.logger.log(
      `Ensured user db indexes: ${ranOnUsers} users, ${indexesCreated} created, ${indexesExisting} already present`,
    )

    return { ranOnUsers, indexesCreated, indexesExisting }
  }
}
