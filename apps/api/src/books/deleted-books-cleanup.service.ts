import type { AnnotationDocType, LinkDocType } from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "../couch/couch.service.js"
import { listUserDatabases } from "../couch/listUserDatabases.js"
import { deleteDocumentsOfDeletedBooks } from "./deleteDocumentsOfDeletedBooks.js"

@Injectable()
export class DeletedBooksCleanupService {
  private readonly logger = new Logger(DeletedBooksCleanupService.name)

  constructor(private readonly couchService: CouchService) {}

  @Cron("0 4 * * *")
  async cleanupDocumentsOfDeletedBooks() {
    const db = await this.couchService.createAdminNanoInstance()
    const userDbs = await listUserDatabases(db)

    for (const userDb of userDbs) {
      try {
        const deletedAnnotationCount = await deleteDocumentsOfDeletedBooks(
          db.use<AnnotationDocType>(userDb.dbName),
          { model: "annotation", getBookId: (annotation) => annotation.bookId },
        )
        const deletedLinkCount = await deleteDocumentsOfDeletedBooks(
          db.use<LinkDocType>(userDb.dbName),
          { model: "link", getBookId: (link) => link.book },
        )

        if (deletedAnnotationCount + deletedLinkCount > 0) {
          this.logger.log(
            `Deleted ${deletedAnnotationCount} annotation(s) and ${deletedLinkCount} link(s) of deleted books in ${userDb.dbName}`,
          )
        }
      } catch (error) {
        this.logger.error(
          `Failed to delete the documents of deleted books in ${userDb.dbName}`,
          error,
        )
      }
    }
  }
}
