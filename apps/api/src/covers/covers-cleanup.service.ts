import {
  type BookDocType,
  type CollectionDocType,
  getBookCoverKey,
  getCollectionCoverKey,
} from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "../couch/couch.service.js"
import { findAll } from "../couch/dbHelpers.js"
import { mapUserDatabases } from "../couch/mapUserDatabases.js"
import { formatDuration } from "../storage/formatDuration.js"
import { CoversService } from "./covers.service.js"

@Injectable()
export class CoversCleanupService {
  private readonly logger = new Logger(CoversCleanupService.name)

  constructor(
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
  ) {}

  /**
   * Virtual set of cover keys that are still valid to keep if a matching file
   * exists on disk.
   *
   * This is intentionally not a list of files confirmed to exist. It is the
   * set of keys derived from current books/collections that should not be
   * treated as dangling during cleanup.
   */
  private async listKeepableCoverKeys() {
    const db = await this.couchService.createAdminNanoInstance()
    const keepableCoverKeysPerUser = await mapUserDatabases(
      db,
      async function listUserKeepableCoverKeys(userDb) {
        const userDbInstance = db.use<
          Pick<BookDocType, "_id" | "rx_model"> &
            Pick<CollectionDocType, "metadata">
        >(userDb.dbName)

        const books = await findAll(userDbInstance, {
          selector: {
            rx_model: "book",
          },
          fields: ["_id"],
        })

        const collections = await findAll(userDbInstance, {
          selector: {
            rx_model: "obokucollection",
          },
          fields: ["_id", "metadata"],
        })

        const collectionsWithDedicatedCover = collections.filter(
          function hasDedicatedCover(collection) {
            return !!collection.metadata?.some(
              (metadata) => metadata.cover?.uri,
            )
          },
        )

        return [
          ...books.map((book) => getBookCoverKey(userDb.userNameHex, book._id)),
          ...collectionsWithDedicatedCover.map((collection) =>
            getCollectionCoverKey(userDb.userNameHex, collection._id),
          ),
        ]
      },
    )

    return new Set(keepableCoverKeysPerUser.flat())
  }

  @Cron("0 3 * * *")
  async cleanupDanglingCovers() {
    if (this.coversService.appConfig.COVERS_STORAGE_STRATEGY !== "fs") {
      this.logger.log(
        "Skipping covers cleanup because storage strategy is not fs",
      )
      return
    }

    const gracePeriodMs =
      this.coversService.appConfig.COVERS_CLEANUP_GRACE_PERIOD_MS
    const [storedCovers, keepableCoverKeys] = await Promise.all([
      this.coversService.listStoredCovers(),
      this.listKeepableCoverKeys(),
    ])

    const danglingCovers = storedCovers.filter(
      (cover) => !keepableCoverKeys.has(cover.key),
    )
    const deletableDanglingCovers = danglingCovers.filter((cover) => {
      if (!cover.lastModifiedAt) {
        return false
      }

      const ageInMs = Date.now() - new Date(cover.lastModifiedAt).getTime()

      return Number.isFinite(ageInMs) && ageInMs >= gracePeriodMs
    })

    if (danglingCovers.length === 0) {
      this.logger.log(
        `No dangling covers found among ${storedCovers.length} stored covers`,
      )
      return
    }

    if (deletableDanglingCovers.length === 0) {
      this.logger.log(
        `Found ${danglingCovers.length} dangling cover(s), but all are still within the ${formatDuration(
          gracePeriodMs,
        )} grace period`,
      )
      return
    }

    const deleteResult = await this.coversService.deleteCovers(
      deletableDanglingCovers.map((cover) => cover.key),
    )
    const deletedSizeInBytes = deletableDanglingCovers
      .filter((cover) => deleteResult.deletedKeys.includes(cover.key))
      .reduce((sum, cover) => sum + cover.sizeInBytes, 0)

    this.logger.log(
      `Deleted ${deleteResult.deletedKeys.length}/${deletableDanglingCovers.length} dangling covers older than ${formatDuration(
        gracePeriodMs,
      )} and reclaimed ${Math.round(deletedSizeInBytes / 1024)} KB`,
    )

    if (deleteResult.failedKeys.length > 0) {
      this.logger.warn(
        `Failed to delete ${deleteResult.failedKeys.length} dangling cover(s): ${deleteResult.failedKeys
          .map((item) => item.key)
          .join(", ")}`,
      )
    }
  }
}
