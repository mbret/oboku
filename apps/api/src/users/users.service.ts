import { Injectable, Logger } from "@nestjs/common"
import { UserPostgresEntity } from "../features/postgres/entities"
import { UserPostgresService } from "../features/postgres/user-postgres.service"
import { CouchService } from "../couch/couch.service"
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
   * Permanently deletes the user account and all associated data across
   * PostgreSQL, CouchDB, and cover storage.
   *
   * Token invalidation note: after deletion the Postgres user row no longer
   * exists, so `refreshToken()` will reject renewal attempts. The CouchDB
   * database is destroyed, making the access token useless for data access.
   * The client signs out immediately, clearing locally cached tokens.
   */
  async deleteAccount({ userId, email }: { userId: number; email: string }) {
    const adminNano = await this.couchService.createAdminNanoInstance()
    const nameHex = Buffer.from(email).toString("hex")
    const dbName = `userdb-${nameHex}`

    let coverKeys: string[] = []

    try {
      const userDb = adminNano.use(dbName)

      const [bookResult, collectionResult] = await Promise.all([
        userDb.find({
          selector: { rx_model: "book" },
          fields: ["_id"],
          limit: 999999,
        }),
        userDb.find({
          selector: { rx_model: "obokucollection" },
          fields: ["_id"],
          limit: 999999,
        }),
      ])

      coverKeys = [
        ...bookResult.docs.map((d) => `cover-${d._id}`),
        ...collectionResult.docs.map((d) => `collection-${d._id}`),
      ]
    } catch (error) {
      this.logger.warn(
        `Could not read CouchDB data for cover cleanup: ${error}`,
      )
    }

    if (coverKeys.length > 0) {
      try {
        await this.coversService.deleteCovers(coverKeys)
      } catch (error) {
        this.logger.warn(`Cover cleanup failed (best-effort): ${error}`)
      }
    }

    try {
      await adminNano.db.destroy(dbName)
    } catch (error) {
      this.logger.warn(`Failed to destroy CouchDB database ${dbName}: ${error}`)
    }

    try {
      const usersDb = adminNano.use("_users")
      const couchUserDocId = `org.couchdb.user:${email}`
      const couchUserDoc = await usersDb.get(couchUserDocId)
      await usersDb.destroy(couchUserDocId, couchUserDoc._rev)
    } catch (error) {
      this.logger.warn(`Failed to delete CouchDB user document: ${error}`)
    }

    await this.notificationPostgresService.deleteDeliveriesByUserId(userId)
    await this.syncReportPostgresService.deleteByUserName(email)
    await this.userPostgresService.deleteById(userId)
  }
}
