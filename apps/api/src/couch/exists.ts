import type nano from "nano"
import { isCouchNotFound } from "./dbHelpers"

export const exists = async (db: nano.DocumentScope<unknown>, id: string) => {
  try {
    await db.head(id)
    return true
  } catch (error) {
    if (isCouchNotFound(error)) {
      return false
    }

    throw error // Re-throw for other errors
  }
}
