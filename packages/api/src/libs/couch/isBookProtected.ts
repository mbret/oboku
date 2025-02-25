import createNano from "nano"
import { findTags } from "./findTags"

export const isBookProtected = async (
  db: createNano.DocumentScope<unknown>,
  book: { tags: string[] },
) => {
  if (!book.tags.length) return false

  const tags = await findTags(db, {
    selector: {
      _id: {
        $in: book.tags,
      },
    },
  })

  return tags.some(({ isProtected }) => isProtected)
}
