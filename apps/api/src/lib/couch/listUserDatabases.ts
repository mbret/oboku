import type createNano from "nano"
import { emailToNameHex, emailToUserDbName } from "src/couch/couch.service"
import { UserCouchEntity } from "src/lib/couchDbEntities"

export const listUserDatabases = async (db: createNano.ServerScope) => {
  const usersDb = db.use<UserCouchEntity>("_users")
  const result = await usersDb.find({
    selector: { type: "user" },
    limit: 99999,
  })

  return result.docs.map((user) => ({
    email: user.name,
    userNameHex: emailToNameHex(user.name),
    dbName: emailToUserDbName(user.name),
  }))
}
