import { Injectable, Logger } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { UserCouchEntity } from "src/lib/couchDbEntities"

const logger = new Logger("MigrationService")

/**
 * Migration: webdavConnectors → connectors
 *
 * Safety:
 * - Preserves existing connector IDs so datasources and books (connectorId) keep working.
 * - One atomic update per user: read settings → build new state → single insert with _rev.
 * - Idempotent: re-run skips connectors that already exist in `connectors`, then removes webdavConnectors.
 * - No secret data is moved; we only copy references (passwordAsSecretId).
 * - Users without a settings doc (404) are skipped without failing the whole run.
 * - If CouchDB returns 409 (concurrent edit), the migration throws and that user is left unchanged until re-run.
 */

type WebdavConnectorLegacy = {
  id?: string
  url: string
  username: string
  passwordAsSecretId: string
}

type SettingsDoc = {
  _id: string
  _rev?: string
  connectors?: Array<{
    id: string
    type: string
    url?: string
    username?: string
    passwordAsSecretId?: string
  }>
  webdavConnectors?: WebdavConnectorLegacy[]
  [key: string]: unknown
}

@Injectable()
export class CouchMigrationService {
  constructor(private readonly couchService: CouchService) {}

  async migrateWebdavConnectorsToConnectors(): Promise<{
    usersMigrated: number
    connectorsCreated: number
  }> {
    // Step 1: Get admin CouchDB client and list all user databases
    const db = await this.couchService.createAdminNanoInstance()

    const usersDb = db.use<UserCouchEntity>("_users")
    const result = await usersDb.find({
      selector: { type: "user" },
      limit: 99999,
    })

    const userDbs = result.docs.map(
      (user) => `userdb-${Buffer.from(user.name).toString("hex")}`,
    )

    logger.log(
      `Migrating webdavConnectors to connectors for ${userDbs.length} user databases`,
    )

    let usersMigrated = 0
    let connectorsCreated = 0

    for (const userDbName of userDbs) {
      const userDbInstance = db.use<SettingsDoc>(userDbName)

      // Step 2: Load the user's settings document (skip if missing)
      let settings: SettingsDoc
      try {
        settings = await userDbInstance.get("settings")
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 404
        ) {
          continue
        }
        throw err
      }

      // Step 3: Skip users that have nothing to migrate
      const webdavConnectors = settings.webdavConnectors
      if (
        !webdavConnectors ||
        !Array.isArray(webdavConnectors) ||
        webdavConnectors.length === 0
      ) {
        continue
      }

      // Step 4: Build new connector entries from webdavConnectors that have an id (skip
      // entries without id—they can't be linked from datasources/books). Reuse the same ID
      // so existing references keep working. Skip any webdav entry whose ID already exists
      // in connectors (idempotent re-run).
      const existingConnectorIds = new Set(
        (settings.connectors ?? []).map((c) => c.id),
      )

      const newConnectors = webdavConnectors
        .filter((w): w is WebdavConnectorLegacy & { id: string } => {
          if (!w.id) {
            logger.warn(
              `${userDbName}: skipping webdav connector without id (url: ${w.url})`,
            )
            return false
          }
          return !existingConnectorIds.has(w.id)
        })
        .map((w) => ({
          id: w.id,
          type: "webdav" as const,
          url: w.url,
          username: w.username,
          passwordAsSecretId: w.passwordAsSecretId,
        }))

      // Step 5: Merge new connectors into settings and remove deprecated webdavConnectors
      const updated: SettingsDoc = {
        ...settings,
        connectors: [...(settings.connectors ?? []), ...newConnectors],
      }
      delete updated.webdavConnectors

      // Step 6: Write back in a single update (CouchDB update via insert with _rev)
      await userDbInstance.insert(updated)
      usersMigrated++
      connectorsCreated += newConnectors.length
      logger.log(
        `${userDbName}: migrated ${newConnectors.length} webdav connector(s)`,
      )
    }

    logger.log(
      `Migrated webdavConnectors to connectors: ${usersMigrated} users, ${connectorsCreated} connectors created`,
    )

    return { usersMigrated, connectorsCreated }
  }

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
