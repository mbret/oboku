import { useNavigate } from "react-router-dom"
import { ROUTES } from "../../constants"
import { useDownloadBook } from "../../download/useDownloadBook"
import { getEnrichedBookState } from "../states"
import { booksDownloadStateSignal } from "../../download/states"
import { getProtectedTags, getTagsByIds } from "../../tags/helpers"
import { useDatabase } from "../../rxdb"
import { useCallback } from "react"
import { getCollections } from "../../collections/dbHelpers"
import { getBookById } from "../dbHelpers"

export const useDefaultItemClickHandler = () => {
  const { mutate: downloadFile } = useDownloadBook()
  const navigate = useNavigate()
  const { db } = useDatabase()

  return useCallback(
    async (id: string) => {
      if (!db) return

      const normalizedCollections = await getCollections(db)
      const normalizedLinks = (await db.collections.link.find().exec()).map(
        (link) => link.toJSON()
      )
      const book = await getBookById({ database: db, id })

      const item = getEnrichedBookState({
        bookId: id,
        normalizedBookDownloadsState: booksDownloadStateSignal.getValue(),
        protectedTagIds: db ? await getProtectedTags(db) : [],
        tags: db ? await getTagsByIds(db) : {},
        normalizedLinks,
        normalizedCollections,
        book
      })

      if (item?.downloadState === "none") {
        item?._id && downloadFile(item)
      } else if (item?.downloadState === "downloaded") {
        navigate(ROUTES.READER.replace(":id", item?._id))
      }
    },
    [db, downloadFile, navigate]
  )
}
