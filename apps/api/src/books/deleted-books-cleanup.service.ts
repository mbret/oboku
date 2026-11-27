import type { AnnotationDocType, LinkDocType } from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { CouchService } from "../couch/couch.service.js"
import { mapUserDatabases } from "../couch/mapUserDatabases.js"
import type { UserDatabase } from "../couch/listUserDatabases.js"
import { deleteDocumentsOfDeletedBooks } from "./deleteDocumentsOfDeletedBooks.js"

@Injectable()
export class DeletedBooksCleanupService {
  private readonly logger = new Logger(DeletedBooksCleanupService.name)

  constructor(private readonly couchService: CouchService) {}

  @Cron("0 4 * * *")
  async cleanupDocumentsOfDeletedBooks() {
    const db = await this.couchService.createAdminNanoInstance()

    const deleteUserDocumentsOfDeletedBooks = async (userDb: UserDatabase) => {
      try {
        const deletedAnnotationCount = await deleteDocumentsOfDeletedBooks(
          db.use<AnnotationDocType>(userDb.dbName),
          { model: "annotation", getBookId: (annotation) => annotation.bookId },
        )
        const deletedLinkCount = await deleteDocumentsOfDeletedBooks(
          db.use<LinkDocType>(userDb.dbName),
          { model: "link", getBookId: (link) => link.book },
        )

        const deletedDocumentCount = deletedAnnotationCount + deletedLinkCount

        if (deletedDocumentCount > 0) {
          this.logger.log(
            `Deleted ${deletedAnnotationCount} annotation(s) and ${deletedLinkCount} link(s) of deleted books in ${userDb.dbName}`,
          )
        }

        return deletedDocumentCount
      } catch (error) {
        this.logger.error(
          `Failed to delete the documents of deleted books in ${userDb.dbName}`,
          error,
        )

        return 0
      }
    }

    await mapUserDatabases(db, deleteUserDocumentsOfDeletedBooks)
  }
}
