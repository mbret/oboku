import type { AnnotationDocType } from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "../couch/couch.service.js"
import { listUserDatabases } from "../couch/listUserDatabases.js"
import { removeAnnotationsOfDeletedBooks } from "./removeAnnotationsOfDeletedBooks.js"

@Injectable()
export class AnnotationsCleanupService {
  private readonly logger = new Logger(AnnotationsCleanupService.name)

  constructor(private readonly couchService: CouchService) {}

  @Cron("0 4 * * *")
  async cleanupAnnotationsOfDeletedBooks() {
    const db = await this.couchService.createAdminNanoInstance()
    const userDbs = await listUserDatabases(db)

    for (const userDb of userDbs) {
      try {
        const removedCount = await removeAnnotationsOfDeletedBooks(
          db.use<AnnotationDocType>(userDb.dbName),
        )

        if (removedCount > 0) {
          this.logger.log(
            `Removed ${removedCount} annotation(s) of deleted books in ${userDb.dbName}`,
          )
        }
      } catch (error) {
        this.logger.error(
          `Failed to remove the annotations of deleted books in ${userDb.dbName}`,
          error,
        )
      }
    }
  }
}
