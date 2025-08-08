import { useNavigate } from "react-router"
import { useDownloadBook } from "../../download/useDownloadBook"
import { getBookDownloadsState } from "../../download/states"
import { useDatabase } from "../../rxdb"
import { useCallback } from "react"
import { getBookById } from "../dbHelpers"
import { ROUTES } from "../../navigation/routes"

export const useDefaultItemClickHandler = () => {
  const { mutate: downloadFile } = useDownloadBook()
  const navigate = useNavigate()
  const { db } = useDatabase()

  return useCallback(
    async (id: string) => {
      if (!db) return

      const book = await getBookById({ database: db, id })
      const downloadState = getBookDownloadsState({ bookId: id })

      if (!book) return

      if (downloadState?.downloadState === "none") {
        book?._id && downloadFile(book)
      } else if (downloadState?.downloadState === "downloaded") {
        navigate(ROUTES.READER.replace(":id", book?._id))
      }
    },
    [db, downloadFile, navigate],
  )
}
