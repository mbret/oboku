import {
  type BookDocType,
  type CollectionDocType,
  getBookCoverKey,
  getCollectionCoverKey,
} from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "src/couch/couch.service"
import { listUserDatabases } from "src/lib/couch/listUserDatabases"
import { formatDuration } from "src/lib/utils"
import { CoversService } from "./covers.service"

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
    const userDbs = await listUserDatabases(db)
    const keepableCoverKeys = new Set<string>()

    for (const userDb of userDbs) {
      const userDbInstance = db.use<
        Pick<BookDocType, "_id" | "rx_model"> &
          Pick<CollectionDocType, "metadata">
      >(userDb.dbName)

      const books = await userDbInstance.find({
        selector: {
          rx_model: "book",
        },
        fields: ["_id"],
        limit: 99999,
      })

      for (const book of books.docs) {
        keepableCoverKeys.add(getBookCoverKey(userDb.userNameHex, book._id))
      }

      const collections = await userDbInstance.find({
        selector: {
          rx_model: "obokucollection",
        },
        fields: ["_id", "metadata"],
        limit: 99999,
      })

      for (const collection of collections.docs) {
        const hasDedicatedCover = !!collection.metadata?.some(
          (metadata) => metadata.cover?.uri,
        )

        if (!hasDedicatedCover) {
          continue
        }

        keepableCoverKeys.add(
          getCollectionCoverKey(userDb.userNameHex, collection._id),
        )
      }
    }

    return keepableCoverKeys
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
