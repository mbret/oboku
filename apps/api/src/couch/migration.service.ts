import { Injectable, Logger } from "@nestjs/common"
import { CouchService } from "./couch.service"
import { listUserDatabases } from "src/lib/couch/listUserDatabases"

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
  data?: Record<string, unknown> | string | null
  modifiedAt?: string | null
  [key: string]: unknown
}

type CollectionDoc = {
  _id: string
  _rev?: string
  linkType?: string
  linkResourceId?: string
  linkData?: Record<string, unknown> | string | null
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
 * - `webdav://{encoded filePath}` (current canonical format)
 * - `webdav://_:{encoded filePath}` (dummy-host legacy format)
 * - `webdav://host:{encoded filePath}` (host-based legacy format)
 */
const extractFilePathFromWebdavResourceIdForMigration = (
  resourceId: string,
) => {
  if (!resourceId.startsWith("webdav://")) {
    return null
  }

  const withoutPrefix = resourceId.substring("webdav://".length)
  const encodedFilePath = withoutPrefix.includes(":")
    ? withoutPrefix.substring(withoutPrefix.lastIndexOf(":") + 1)
    : withoutPrefix

  try {
    return decodeURIComponent(encodedFilePath)
  } catch {
    return null
  }
}

/**
 * Snapshot canonical formatter for the WebDAV ids produced by this migration.
 *
 * Target format:
 * - `webdav://{encoded filePath}`
 */
const generateCanonicalWebdavResourceIdForMigration = (filePath: string) =>
  `webdav://${encodeURIComponent(filePath)}`

const toCanonicalWebdavResourceId = (resourceId: string) => {
  const filePath = extractFilePathFromWebdavResourceIdForMigration(resourceId)

  if (!filePath) {
    return null
  }

  return generateCanonicalWebdavResourceIdForMigration(filePath)
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Older CouchDB installs may store `data` / `linkData` as a JSON-encoded
 * string rather than an object. This normalises either representation into
 * a plain object (or null) so the migration can safely spread it.
 */
function normalizeDataField(value: unknown): Record<string, unknown> | null {
  if (value == null) return null
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        // Validated as a plain object originating from legacy JSON-string storage
        return parsed as Record<string, unknown>
      }
    } catch {
      // Malformed JSON – treat as absent
    }
    return null
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    // Already an object; safe to treat as record after the runtime checks above
    return value as Record<string, unknown>
  }
  return null
}

/**
 * Parses a legacy resourceId / linkResourceId string and returns the identity
 * fields to merge into data / linkData for the given provider type.
 * Returns null if there is nothing to migrate.
 */
function migrateResourceIdToData(
  type: string,
  resourceId: string,
  existingData: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const base = existingData ?? {}

  switch (type) {
    case "DRIVE": {
      const fileId = resourceId.startsWith("drive-")
        ? resourceId.substring("drive-".length)
        : resourceId
      return { ...base, fileId }
    }

    case "dropbox": {
      const fileId = resourceId.startsWith("dropbox-")
        ? resourceId.substring("dropbox-".length)
        : resourceId
      return { ...base, fileId }
    }

    case "webdav": {
      const withoutPrefix = resourceId.startsWith("webdav://")
        ? resourceId.substring("webdav://".length)
        : resourceId
      // Strip the host portion from the legacy "webdav://host:encodedPath"
      // format. Must stay in sync with the client-side migration in
      // apps/web/src/rxdb/collections/utils.ts.
      const encodedFilePath = withoutPrefix.includes(":")
        ? withoutPrefix.substring(withoutPrefix.lastIndexOf(":") + 1)
        : withoutPrefix
      return { ...base, filePath: safeDecodeURIComponent(encodedFilePath) }
    }

    case "synology-drive": {
      const withoutPrefix = resourceId.startsWith("synology-drive://")
        ? resourceId.substring("synology-drive://".length)
        : resourceId
      return { ...base, fileId: safeDecodeURIComponent(withoutPrefix) }
    }

    case "server": {
      const withoutPrefix = resourceId.startsWith("server://")
        ? resourceId.substring("server://".length)
        : resourceId
      return { ...base, filePath: safeDecodeURIComponent(withoutPrefix) }
    }

    case "URI": {
      const url = resourceId.startsWith("oboku-link-")
        ? resourceId.substring("oboku-link-".length)
        : resourceId
      return { ...base, url }
    }

    case "file":
      return null

    default:
      return null
  }
}

@Injectable()
export class CouchMigrationService {
  constructor(private readonly couchService: CouchService) {}

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
    const db = await this.couchService.createAdminNanoInstance()
    const userDbs = await listUserDatabases(db)

    logger.log(
      `Migrating webdavConnectors to connectors for ${userDbs.length} user databases`,
    )

    let usersMigrated = 0
    let connectorsCreated = 0

    for (const { dbName: userDbName } of userDbs) {
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
     * - Extract the file/folder path (`filePath`).
     * - Rebuild the value with `generateWebdavResourceId({ filePath })`.
     * - Save the document back with the canonical id.
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
    const db = await this.couchService.createAdminNanoInstance()
    const userDbs = await listUserDatabases(db)

    logger.log(
      `Migrating legacy WebDAV resource IDs for ${userDbs.length} user databases`,
    )

    let usersMigrated = 0
    let linksUpdated = 0
    let collectionsUpdated = 0

    for (let i = 0; i < userDbs.length; i++) {
      const userEntry = userDbs[i]
      if (!userEntry) continue
      const { dbName: userDbName, email } = userEntry
      const userDbInstance = db.use<LinkDoc | CollectionDoc>(userDbName)
      const docsToUpdate: (LinkDoc | CollectionDoc)[] = []
      let userLinksUpdated = 0
      let userCollectionsUpdated = 0

      const links = await userDbInstance.find({
        selector: {
          rx_model: "link",
          type: "webdav",
          resourceId: { $exists: true },
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

        docsToUpdate.push({
          ...link,
          resourceId: canonicalResourceId,
        })
        userLinksUpdated += 1
      }

      const collections = await userDbInstance.find({
        selector: {
          rx_model: "obokucollection",
          linkType: "webdav",
          linkResourceId: { $exists: true },
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

        docsToUpdate.push({
          ...collection,
          linkResourceId: canonicalResourceId,
        })
        userCollectionsUpdated += 1
      }

      linksUpdated += userLinksUpdated
      collectionsUpdated += userCollectionsUpdated

      if (docsToUpdate.length > 0) {
        await userDbInstance.bulk({ docs: docsToUpdate })
        usersMigrated += 1
        logger.log(
          `[${i + 1}/${userDbs.length}] ${email}: ${userLinksUpdated} links, ${userCollectionsUpdated} collections`,
        )
      } else {
        logger.log(
          `[${i + 1}/${userDbs.length}] ${email}: skipped (nothing to migrate)`,
        )
      }
    }

    logger.log(
      `Migrated legacy WebDAV resource IDs: ${usersMigrated} users, ${linksUpdated} links, ${collectionsUpdated} collections`,
    )

    return { usersMigrated, linksUpdated, collectionsUpdated }
  }

  async migrateResourceIdToLinkData(): Promise<{
    usersMigrated: number
    linksUpdated: number
    collectionsUpdated: number
  }> {
    /**
     * Migration: `resourceId` -> `data` identity fields on links,
     *            `linkResourceId` -> `linkData` identity fields on collections.
     *
     * Why this exists:
     * - Previously, each link encoded its provider-specific identity (fileId,
     *   filePath, url) into a single `resourceId` string using a prefix scheme
     *   (e.g. "drive-{fileId}", "webdav://{encodedPath}").
     * - The code now stores identity fields directly in `link.data` (e.g.
     *   `data.fileId`, `data.filePath`) and queries by those fields.
     * - Collections had the same pattern with `linkResourceId`.
     *
     * Exactly what this migration rewrites:
     * - For every `link` document: parses `resourceId` per `type`, merges the
     *   extracted identity field into `data`, removes `resourceId`.
     * - For every `obokucollection` document: parses `linkResourceId` per
     *   `linkType`, merges into `linkData`, removes `linkResourceId`.
     *
     * Idempotency:
     * - Safe to run more than once.
     * - Documents without `resourceId` / `linkResourceId` are skipped.
     * - Documents that already have the identity field in `data` / `linkData`
     *   are skipped (the extracted value would match what's already there).
     */
    const db = await this.couchService.createAdminNanoInstance()
    const userDbs = await listUserDatabases(db)

    logger.log(
      `Migrating resourceId to link data for ${userDbs.length} user databases`,
    )

    let usersMigrated = 0
    let linksUpdated = 0
    let collectionsUpdated = 0

    for (let i = 0; i < userDbs.length; i++) {
      const userEntry = userDbs[i]
      if (!userEntry) continue
      const { dbName: userDbName, email } = userEntry
      const userDb = db.use<LinkDoc | CollectionDoc>(userDbName)
      const docsToUpdate: (LinkDoc | CollectionDoc)[] = []
      let userLinksUpdated = 0
      let userCollectionsUpdated = 0

      const links = await userDb.find({
        selector: { rx_model: "link", resourceId: { $exists: true } },
        limit: 99999,
      })

      for (const link of links.docs) {
        if (typeof link.resourceId !== "string") {
          continue
        }

        const newData = migrateResourceIdToData(
          link.type ?? "",
          link.resourceId,
          normalizeDataField(link.data),
        )

        if (!newData) continue

        const { resourceId: _, ...rest } = link

        docsToUpdate.push({
          ...rest,
          data: newData,
        })
        userLinksUpdated += 1
      }

      const collections = await userDb.find({
        selector: {
          rx_model: "obokucollection",
          linkResourceId: { $exists: true },
        },
        limit: 99999,
      })

      for (const collection of collections.docs) {
        if (typeof collection.linkResourceId !== "string") {
          continue
        }

        const newLinkData = migrateResourceIdToData(
          collection.linkType ?? "",
          collection.linkResourceId,
          normalizeDataField(collection.linkData),
        )

        if (!newLinkData) continue

        const { linkResourceId: _, ...rest } = collection

        docsToUpdate.push({
          ...rest,
          linkData: newLinkData,
        })
        userCollectionsUpdated += 1
      }

      linksUpdated += userLinksUpdated
      collectionsUpdated += userCollectionsUpdated

      if (docsToUpdate.length > 0) {
        await userDb.bulk({ docs: docsToUpdate })
        usersMigrated += 1
        logger.log(
          `[${i + 1}/${userDbs.length}] ${email}: ${userLinksUpdated} links, ${userCollectionsUpdated} collections`,
        )
      } else {
        logger.log(
          `[${i + 1}/${userDbs.length}] ${email}: skipped (nothing to migrate)`,
        )
      }
    }

    logger.log(
      `Migrated resourceId to link data: ${usersMigrated} users, ${linksUpdated} links, ${collectionsUpdated} collections`,
    )

    return { usersMigrated, linksUpdated, collectionsUpdated }
  }
}
