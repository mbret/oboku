import { crypto } from "@oboku/shared"
import { useDatabase } from "../rxdb"

export const useUpdateContentPassword = () => {
  const { db } = useDatabase()

  return async (password: string) => {
    const hashed = await crypto.hashContentPassword(password)

    await db?.settings.safeUpdate(
      { $set: { contentPassword: hashed } },
      (collection) => collection.findOne()
    )
  }
}
