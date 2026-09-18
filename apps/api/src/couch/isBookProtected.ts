import type createNano from "nano"
import { find } from "./dbHelpers"

export const isBookProtected = async (
  db: createNano.DocumentScope<unknown>,
  book: { tags: string[] },
) => {
  if (!book.tags.length) return false

  const tags = await find(db, "tag", {
    selector: {
      _id: {
        $in: book.tags,
      },
    },
  })

  return tags.some(({ isProtected }) => isProtected)
}
