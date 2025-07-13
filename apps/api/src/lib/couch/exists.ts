import type nano from "nano"

export const exists = async (db: nano.DocumentScope<unknown>, id: string) => {
  try {
    await db.head(id)
    return true
  } catch (error) {
    if ((error as any).statusCode === 404) {
      return false
    }

    throw error // Re-throw for other errors
  }
}
