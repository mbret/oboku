import type { AnnotationDocType, LinkDocType } from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "../couch/couch.service.js"
import { listUserDatabases } from "../couch/listUserDatabases.js"
import { deleteDocumentsOfDeletedBooks } from "./deleteDocumentsOfDeletedBooks.js"
import { removeReferencesToDeletedDocuments } from "./removeReferencesToDeletedDocuments.js"

@Injectable()
export class DeletedDocumentsCleanupService {
  private readonly logger = new Logger(DeletedDocumentsCleanupService.name)

  constructor(private readonly couchService: CouchService) {}

  @Cron("0 4 * * *")
  async cleanupAfterDeletedDocuments() {
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

        const updatedDocumentCount = await removeReferencesToDeletedDocuments(
          db.use(userDb.dbName),
        )

        if (updatedDocumentCount > 0) {
          this.logger.log(
            `Removed the references to deleted documents from ${updatedDocumentCount} document(s) in ${userDb.dbName}`,
          )
        }
      } catch (error) {
        this.logger.error(
          `Failed to clean up after the deleted documents in ${userDb.dbName}`,
          error,
        )
      }
    }
  }
}
