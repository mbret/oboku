import { Injectable, Logger } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { UserCouchEntity } from "src/lib/couchDbEntities"

const logger = new Logger("MigrationService")

@Injectable()
export class CouchMigrationService {
  constructor(private readonly couchService: CouchService) {}

  async migrate() {
    const db = await this.couchService.createAdminNanoInstance()

    const usersDb = db.use<UserCouchEntity>("_users")
    const result = await usersDb.find({
      selector: {
        type: "user",
      },
      limit: 99999,
    })

    const users = result.docs
    const userDbs = users.map(
      (user) => `userdb-${Buffer.from(user.name).toString("hex")}`,
    )

    logger.log(`Migrating ${userDbs.length} user databases`)

    let linkChanged = 0
    const userChanged = new Set<string>()

    for (const userDbName of userDbs) {
      const userDbInstance = db.use(userDbName)

      logger.log(`Migrating ${userDbName} links.data`)

      const result = await userDbInstance.find({
        selector: {
          rx_model: "link",
        },
        limit: 99999,
      })

      logger.log(`Found ${result.docs.length} links in ${userDbName}`)

      for (const link of result.docs) {
        if ("data" in link && typeof link.data === "string") {
          logger.log(`Migrating ${link._id} to use data JSON format`)

          try {
            link.data = JSON.parse(link.data)
          } catch (error) {
            console.error(error)
            link.data = {}
          }

          await userDbInstance.insert(link)
          linkChanged++
          userChanged.add(userDbName)
        }
      }
    }

    logger.log(`Migrated ${linkChanged} links in ${userChanged.size} users`)
  }
}
