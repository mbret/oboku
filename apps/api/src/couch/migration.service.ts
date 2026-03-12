import { Injectable, Logger } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { UserCouchEntity } from "src/lib/couchDbEntities"

const logger = new Logger("MigrationService")

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

type LinkDoc = {
  _id: string
  _rev?: string
  type?: string
  resourceId?: string
  modifiedAt?: string | null
  [key: string]: unknown
}

type CollectionDoc = {
  _id: string
  _rev?: string
  linkType?: string
  linkResourceId?: string
  modifiedAt?: string | null
  [key: string]: unknown
}

/**
 * Snapshot parser for the legacy WebDAV resource-id formats this migration is
 * responsible for rewriting.
 *
 * This intentionally does not rely on shared runtime helpers because a data
 * migration should keep working the same way in the future, even if normal app
 * parsing logic evolves again.
 *
 * Accepted inputs:
 * - `webdav://{encoded filename}` (current canonical format)
 * - `webdav://_:{encoded filename}` (dummy-host legacy format)
 * - `webdav://host:{encoded filename}` (host-based legacy format)
 */
const extractFilenameFromWebdavResourceIdForMigration = (
  resourceId: string,
) => {
  if (!resourceId.startsWith("webdav://")) {
    return null
  }

  const withoutPrefix = resourceId.substring("webdav://".length)
  const encodedFilename = withoutPrefix.includes(":")
    ? withoutPrefix.substring(withoutPrefix.lastIndexOf(":") + 1)
    : withoutPrefix

  try {
    return decodeURIComponent(encodedFilename)
  } catch {
    return null
  }
}

/**
 * Snapshot canonical formatter for the WebDAV ids produced by this migration.
 *
 * Target format:
 * - `webdav://{encoded filename}`
 */
const generateCanonicalWebdavResourceIdForMigration = (filename: string) =>
  `webdav://${encodeURIComponent(filename)}`

const toCanonicalWebdavResourceId = (resourceId: string) => {
  const filename = extractFilenameFromWebdavResourceIdForMigration(resourceId)

  if (!filename) {
    return null
  }

  return generateCanonicalWebdavResourceIdForMigration(filename)
}

@Injectable()
export class CouchMigrationService {
  constructor(private readonly couchService: CouchService) {}

  /**
   * Shared helper used by all admin migrations.
   *
   * What it does:
   * - Connects to CouchDB with admin privileges.
   * - Reads the `_users` database.
   * - Builds the physical per-user database names (`userdb-<hex email>`).
   *
   * Why it exists:
   * - Every migration in this service is "run once per user database".
   * - Centralizing this avoids re-implementing the same user-db discovery logic
   *   in each migration and keeps the migration methods focused on the actual
   *   document rewrite they perform.
   */
  private async listUserDatabaseNames() {
    const db = await this.couchService.createAdminNanoInstance()
    const usersDb = db.use<UserCouchEntity>("_users")
    const result = await usersDb.find({
      selector: { type: "user" },
      limit: 99999,
    })

    return {
      db,
      userDbs: result.docs.map(
        (user) => `userdb-${Buffer.from(user.name).toString("hex")}`,
      ),
    }
  }

  async migrateWebdavConnectorsToConnectors(): Promise<{
    usersMigrated: number
    connectorsCreated: number
  }> {
    /**
     * Migration: `settings.webdavConnectors` -> `settings.connectors`
     *
     * Why this exists:
     * - Older app versions stored WebDAV connectors in a dedicated legacy field
     *   named `webdavConnectors`.
     * - Newer code reads connectors from the unified `connectors` array instead.
     *
     * Exactly what this migration rewrites:
     * - Reads the `settings` document in each user database.
     * - Takes every item from `settings.webdavConnectors`.
     * - Copies it into `settings.connectors` as a connector with `type: "webdav"`.
     * - Removes the legacy `settings.webdavConnectors` field from the saved doc.
     *
     * What it preserves:
     * - The existing connector `id`.
     * - `url`
     * - `username`
     * - `passwordAsSecretId`
     *
     * Why preserving the id matters:
     * - Datasources and links reference connectors by id.
     * - Reusing the same id means existing datasource/link references continue
     *   to point to the migrated connector after the rewrite.
     *
     * Explicit skip / no-op behavior:
     * - If a user has no `settings` doc, that user is skipped.
     * - If `webdavConnectors` is missing or empty, that user is skipped.
     * - If a legacy connector has no `id`, it is skipped because existing docs
     *   cannot safely refer back to it.
     * - If a connector id already exists in `settings.connectors`, that legacy
     *   connector is skipped so the migration can be re-run safely.
     *
     * Idempotency:
     * - Safe to run more than once.
     * - Re-running will not duplicate connectors already copied into
     *   `settings.connectors`.
     */
    const { db, userDbs } = await this.listUserDatabaseNames()

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

  async migrateWebdavResourceIds(): Promise<{
    usersMigrated: number
    linksUpdated: number
    collectionsUpdated: number
  }> {
    /**
     * Migration: legacy WebDAV `resourceId` / `linkResourceId` -> canonical WebDAV ID format
     *
     * Why this exists:
     * - Older WebDAV documents stored resource ids using a host-based format.
     * - Newer WebDAV code generates canonical ids in the `webdav://{encoded path}`
     *   format.
     * - Once the app stops supporting the legacy format at runtime, stored docs
     *   must be rewritten ahead of time.
     *
     * Exactly what this migration rewrites:
     * - For `link` documents where `type === "webdav"`:
     *   `resourceId`
     * - For `obokucollection` documents where `linkType === "webdav"`:
     *   `linkResourceId`
     *
     * How each value is transformed:
     * - Parse the existing WebDAV resource id with `explodeWebdavResourceId()`.
     * - Extract the file/folder path (`filename`).
     * - Rebuild the value with `generateWebdavResourceId({ filename })`.
     * - Save the document back with the canonical id and a fresh `modifiedAt`.
     *
     * Important scope note:
     * - This migration only rewrites WebDAV ids.
     * - It does not touch connector definitions, secrets, datasource connector ids,
     *   book ids, or non-WebDAV links/collections.
     *
     * Explicit skip / no-op behavior:
     * - Non-WebDAV docs are never selected.
     * - If a selected doc has no string id field, it is skipped.
     * - If the id cannot be parsed as a WebDAV resource id, it is skipped.
     * - If the parsed id is already in canonical form, it is skipped.
     *
     * Idempotency:
     * - Safe to run more than once.
     * - Once a doc has the canonical WebDAV id, future runs leave it unchanged.
     *
     * Intended lifecycle:
     * - Run from the admin UI before removing legacy WebDAV id compatibility
     *   from the runtime code.
     * - After all relevant environments have been migrated, the old-format
     *   handling can be removed with much lower risk.
     */
    const { db, userDbs } = await this.listUserDatabaseNames()

    logger.log(
      `Migrating legacy WebDAV resource IDs for ${userDbs.length} user databases`,
    )

    let usersMigrated = 0
    let linksUpdated = 0
    let collectionsUpdated = 0

    for (const userDbName of userDbs) {
      const userDbInstance = db.use<LinkDoc | CollectionDoc>(userDbName)
      let userChanged = false

      const links = await userDbInstance.find({
        selector: {
          rx_model: "link",
          type: "webdav",
        },
        limit: 99999,
      })

      for (const link of links.docs) {
        if (typeof link.resourceId !== "string") {
          continue
        }

        const canonicalResourceId = toCanonicalWebdavResourceId(link.resourceId)

        if (!canonicalResourceId || canonicalResourceId === link.resourceId) {
          continue
        }

        await userDbInstance.insert({
          ...link,
          modifiedAt: new Date().toISOString(),
          resourceId: canonicalResourceId,
        })

        userChanged = true
        linksUpdated += 1
      }

      const collections = await userDbInstance.find({
        selector: {
          rx_model: "obokucollection",
          linkType: "webdav",
        },
        limit: 99999,
      })

      for (const collection of collections.docs) {
        if (typeof collection.linkResourceId !== "string") {
          continue
        }

        const canonicalResourceId = toCanonicalWebdavResourceId(
          collection.linkResourceId,
        )

        if (
          !canonicalResourceId ||
          canonicalResourceId === collection.linkResourceId
        ) {
          continue
        }

        await userDbInstance.insert({
          ...collection,
          linkResourceId: canonicalResourceId,
          modifiedAt: new Date().toISOString(),
        })

        userChanged = true
        collectionsUpdated += 1
      }

      if (userChanged) {
        usersMigrated += 1
        logger.log(
          `${userDbName}: migrated legacy WebDAV resource IDs in links and collections`,
        )
      }
    }

    logger.log(
      `Migrated legacy WebDAV resource IDs: ${usersMigrated} users, ${linksUpdated} links, ${collectionsUpdated} collections`,
    )

    return { usersMigrated, linksUpdated, collectionsUpdated }
  }

  async migrate() {
    /**
     * Legacy migration: normalize `link.data` from serialized JSON strings to objects.
     *
     * Why this exists:
     * - Some older link documents stored `data` as a JSON string.
     * - Current code expects `data` to already be a JSON object.
     *
     * Exactly what this migration rewrites:
     * - Scans every `link` document in every user database.
     * - If `link.data` is a string, tries to `JSON.parse()` it.
     * - Re-saves the document with `data` as an object.
     *
     * Parse-failure behavior:
     * - If parsing fails, the migration does not abort the whole user/database.
     * - It logs the error and replaces `data` with `{}` for that document so the
     *   document is still brought into the object-based shape expected by the app.
     *
     * Idempotency:
     * - Safe to run more than once.
     * - Documents already using object-shaped `data` are ignored.
     */
    const { db, userDbs } = await this.listUserDatabaseNames()

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
