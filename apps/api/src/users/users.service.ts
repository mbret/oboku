import { Injectable, Logger } from "@nestjs/common"
import { UserPostgresEntity } from "../features/postgres/entities"
import { UserPostgresService } from "../features/postgres/user-postgres.service"
import {
  CouchService,
  emailToNameHex,
  emailToUserDbName,
} from "../couch/couch.service"
import { deleteCouchUser, find } from "../lib/couch/dbHelpers"
import { getBookCoverKey, getCollectionCoverKey } from "@oboku/shared"
import { CoversService } from "../covers/covers.service"
import { NotificationPostgresService } from "../features/postgres/notification-postgres.service"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService"
import { RefreshTokensService } from "../features/postgres/refreshTokens.service"

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private userPostgresService: UserPostgresService,
    private couchService: CouchService,
    private coversService: CoversService,
    private notificationPostgresService: NotificationPostgresService,
    private syncReportPostgresService: SyncReportPostgresService,
    private refreshTokensService: RefreshTokensService,
  ) {}

  async findUserByEmail(email: string) {
    return this.userPostgresService.findByEmail(email)
  }

  async findUserById(userId: number) {
    return this.userPostgresService.findById(userId)
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
   * **Order (no cross-store transaction):** read Couch for cover keys (best
   * effort) → `deleteCouchUser` → Postgres deletes (refresh sessions,
   * notifications, sync reports, user row). Cover object deletion is
   * fire-and-forget afterward.
   *
   * **Happy path:** When this method completes without throwing, Couch and
   * Postgres are both cleared for that account, so re-registration with the
   * same email is safe immediately. Only cover cleanup runs in the
   * background (slow, does not affect account identity).
   *
   * **Failure after Couch, before Postgres:** If a Postgres step throws after
   * Couch user/DB removal succeeds, the user row (and related Postgres data)
   * can remain while Couch is already gone. Recovery is manual and awkward:
   * e.g. the user might sign in again and auth flows may recreate Couch
   * while Postgres still reflects an existing account. Mitigations would be
   * product-specific (e.g. Postgres-first ordering with compensation if
   * Couch delete fails, or operational repair scripts)—not implemented here.
   */
  async deleteAccount({ userId, email }: { userId: number; email: string }) {
    const adminNano = await this.couchService.createAdminNanoInstance()
    const userNameHex = emailToNameHex(email)

    let coverKeys: string[] = []

    try {
      const userDb = adminNano.use(emailToUserDbName(email))

      const [books, collections] = await Promise.all([
        find(userDb, "book", { fields: ["_id"], limit: 999999 }),
        find(userDb, "obokucollection", { fields: ["_id"], limit: 999999 }),
      ])

      coverKeys = [
        ...books.map((d) => getBookCoverKey(userNameHex, d._id)),
        ...collections.map((d) => getCollectionCoverKey(d._id)),
      ]
    } catch (error) {
      this.logger.warn(
        `Could not read CouchDB data for cover cleanup: ${error}`,
      )
    }

    await deleteCouchUser(adminNano, email)

    await this.refreshTokensService.deleteByUserId(userId)
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
