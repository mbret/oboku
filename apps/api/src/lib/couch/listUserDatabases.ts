import type createNano from "nano"
import { UserCouchEntity } from "src/lib/couchDbEntities"

export const listUserDatabases = async (db: createNano.ServerScope) => {
  const usersDb = db.use<UserCouchEntity>("_users")
  const result = await usersDb.find({
    selector: { type: "user" },
    limit: 99999,
  })

  return result.docs.map((user) => {
    const userNameHex = Buffer.from(user.name).toString("hex")

    return {
      email: user.name,
      userNameHex,
      dbName: `userdb-${userNameHex}`,
    }
  })
}
