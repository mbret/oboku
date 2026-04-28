import { Logger } from "@nestjs/common"
import type createNano from "nano"
import { emailToNameHex, emailToUserDbName } from "src/couch/couch.service"
import { UserCouchEntity } from "src/lib/couchDbEntities"

const logger = new Logger("listUserDatabases")

export const listUserDatabases = async (db: createNano.ServerScope) => {
  logger.log("Listing user databases (querying _users + db list)...")

  const usersDb = db.use<UserCouchEntity>("_users")
  const result = await usersDb.find({
    selector: { type: "user" },
    limit: 99999,
  })

  // Cross-reference _users with the actual database list so orphan _users
  // docs (whose per-user `userdb-*` database has been deleted or never
  // existed) don't crash downstream iteration with 404 "Database does not
  // exist.". `db.db.list()` returns every database on the server; we only
  // care about the per-user ones.
  const existingDbs = new Set(await db.db.list())

  const entries = result.docs.map((user) => ({
    email: user.name,
    userNameHex: emailToNameHex(user.name),
    dbName: emailToUserDbName(user.name),
  }))

  const present = entries.filter((entry) => existingDbs.has(entry.dbName))
  const missing = entries.filter((entry) => !existingDbs.has(entry.dbName))

  if (missing.length > 0) {
    logger.warn(
      `Skipping ${missing.length} orphan _users doc(s) without a userdb: ${missing
        .map((entry) => entry.email)
        .join(", ")}`,
    )
  }

  logger.log(
    `Listed ${present.length} user database(s) (${entries.length} _users entries, ${missing.length} orphans skipped)`,
  )

  return present
}
