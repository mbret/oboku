import { useNavigate } from "react-router-dom"
import { ROUTES } from "../../constants"
import { useDownloadBook } from "../../download/useDownloadBook"
import { getBooksByIds, getEnrichedBookState } from "../states"
import { booksDownloadStateSignal } from "../../download/states"
import { getProtectedTags, getTagsByIds } from "../../tags/helpers"
import { useDatabase } from "../../rxdb"
import { getLinksByIds } from "../../links/states"
import { useCallback } from "react"
import { getCollectionsByIds } from "../../collections/databaseHelpers"

export const useDefaultItemClickHandler = () => {
  const downloadFile = useDownloadBook()
  const navigate = useNavigate()
  const { db } = useDatabase()

  return useCallback(
    async (id: string) => {
      if (!db) return

      const normalizedCollections = await getCollectionsByIds(db)
      const normalizedLinks = await getLinksByIds(db)
      const normalizedBooks = await getBooksByIds(db)

      const item = getEnrichedBookState({
        bookId: id,
        normalizedBookDownloadsState: booksDownloadStateSignal.getValue(),
        protectedTagIds: db ? await getProtectedTags(db) : [],
        tags: db ? await getTagsByIds(db) : {},
        normalizedLinks,
        normalizedCollections,
        normalizedBooks
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
