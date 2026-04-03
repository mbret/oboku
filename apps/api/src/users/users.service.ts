import { Injectable, Logger } from "@nestjs/common"
import { UserPostgresEntity } from "../features/postgres/entities"
import { UserPostgresService } from "../features/postgres/user-postgres.service"
import {
  CouchService,
  emailToCouchUserDocId,
  emailToUserDbName,
} from "../couch/couch.service"
import { find } from "../lib/couch/dbHelpers"
import { CoversService } from "../covers/covers.service"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService"

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private userPostgresService: UserPostgresService,
    private couchService: CouchService,
    private coversService: CoversService,
    private notificationPostgresService: NotificationPostgresService,
    private syncReportPostgresService: SyncReportPostgresService,
  ) {}

  async findUserByEmail(email: string) {
    return this.userPostgresService.findByEmail(email)
  }

  async registerUser(user: Omit<UserPostgresEntity, "id">) {
    return this.userPostgresService.create(user)
  }

  async saveUser(user: UserPostgresEntity) {
    return this.userPostgresService.save(user)
  }

  /**
   * Permanently deletes the user account and all associated data.
   *
   * Postgres and CouchDB deletions are synchronous so re-registration with
   * the same email is safe immediately after the response. Only cover image
   * cleanup runs in the background since it can be slow and doesn't affect
   * account identity.
   */
  async deleteAccount({ userId, email }: { userId: number; email: string }) {
    const adminNano = await this.couchService.createAdminNanoInstance()
    const dbName = emailToUserDbName(email)

    let coverKeys: string[] = []

    try {
      const userDb = adminNano.use(dbName)

      const [books, collections] = await Promise.all([
        find(userDb, "book", { fields: ["_id"], limit: 999999 }),
        find(userDb, "obokucollection", { fields: ["_id"], limit: 999999 }),
      ])

      coverKeys = [
        ...books.map((d) => `cover-${d._id}`),
        ...collections.map((d) => `collection-${d._id}`),
      ]
    } catch (error) {
      this.logger.warn(
        `Could not read CouchDB data for cover cleanup: ${error}`,
      )
    }

    try {
      await adminNano.db.destroy(dbName)
    } catch (error) {
      this.logger.warn(`Failed to destroy CouchDB database ${dbName}: ${error}`)
    }

    try {
      const usersDb = adminNano.use("_users")
      const couchUserDocId = emailToCouchUserDocId(email)
      const couchUserDoc = await usersDb.get(couchUserDocId)
      await usersDb.destroy(couchUserDocId, couchUserDoc._rev)
    } catch (error) {
      this.logger.warn(`Failed to delete CouchDB user document: ${error}`)
    }

    await this.notificationPostgresService.deleteDeliveriesByUserId(userId)
    await this.syncReportPostgresService.deleteByUserName(email)
    await this.userPostgresService.deleteById(userId)

    if (coverKeys.length > 0) {
      this.deleteCoversInBackground(coverKeys)
    }
  }

  private deleteCoversInBackground(coverKeys: string[]) {
    this.coversService.deleteCovers(coverKeys).catch((error) => {
      this.logger.warn(`Background cover cleanup failed: ${error}`)
    })
  }
}
