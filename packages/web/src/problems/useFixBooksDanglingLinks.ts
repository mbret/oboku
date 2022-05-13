import { difference } from "ramda"
import { useCallback } from "react"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"
import { BookDocument } from "../rxdb/schemas/book"

export const useFixBooksDanglingLinks = () => {
  const db = useDatabase()

  const removeDanglingLinksFromBook = useCallback(
    async (doc: BookDocument) => {
      if (doc.links.length === 0) return

      const existingLinksForThisBook = await db?.link
        .safeFind({
          selector: {
            _id: {
              $in: doc.links
            }
          }
        })
        .exec()

      const toRemove = difference(
        doc.links,
        existingLinksForThisBook?.map((doc) => doc._id) ?? []
      )

      if (toRemove.length > 0) {
        await doc.atomicUpdate((data) => ({
          ...data,
          links: data.links.filter((id) => !toRemove.includes(id))
        }))
      }
    },
    [db]
  )

  return useCallback(
    async (data: BookDocument[]) => {
      const yes = window.confirm(
        `
            This action will remove invalid links from books.
            `.replace(/  +/g, "")
      )

      if (yes && db) {
        try {
          // we actually have middleware to deal with it so we will just force an update
          Promise.all(data.map(removeDanglingLinksFromBook))
        } catch (e) {
          Report.error(e)
        }
      }
    },
    [db, removeDanglingLinksFromBook]
  );
}
