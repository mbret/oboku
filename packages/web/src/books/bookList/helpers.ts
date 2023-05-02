import { useNavigate } from "react-router-dom"
import { useRecoilCallback } from "recoil"
import { ROUTES } from "../../constants"
import { useDownloadBook } from "../../download/useDownloadBook"
import { enrichedBookState } from "../states"
import { getNormalizedBookDownloadsState } from "../../download/states"
import { getProtectedTags, getTagsByIds } from "../../tags/helpers"
import { useDatabase } from "../../rxdb"

export const useDefaultItemClickHandler = () => {
  const downloadFile = useDownloadBook()
  const navigate = useNavigate()
  const { db } = useDatabase()

  return useRecoilCallback(
    ({ snapshot }) =>
      async (id: string) => {
        const item = await snapshot.getPromise(
          enrichedBookState({
            bookId: id,
            normalizedBookDownloadsState: getNormalizedBookDownloadsState(),
            protectedTagIds: db ? await getProtectedTags(db) : [],
            tags: db ? await getTagsByIds(db) : {}
          })
        )

        if (item?.downloadState === "none") {
          item?._id && downloadFile(item)
        } else if (item?.downloadState === "downloaded") {
          navigate(ROUTES.READER.replace(":id", item?._id))
        }
      },
    [db]
  )
}
