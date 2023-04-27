import { useNavigate } from "react-router-dom"
import { useRecoilCallback } from "recoil"
import { ROUTES } from "../../constants"
import { useDownloadBook } from "../../download/useDownloadBook"
import { enrichedBookState } from "../states"
import { getNormalizedBookDownloadsState } from "../../download/states"

export const useDefaultItemClickHandler = () => {
  const downloadFile = useDownloadBook()
  const navigate = useNavigate()

  return useRecoilCallback(
    ({ snapshot }) =>
      async (id: string) => {
        const item = await snapshot.getPromise(
          enrichedBookState({
            bookId: id,
            normalizedBookDownloadsState: getNormalizedBookDownloadsState()
          })
        )

        if (item?.downloadState === "none") {
          item?._id && downloadFile(item)
        } else if (item?.downloadState === "downloaded") {
          navigate(ROUTES.READER.replace(":id", item?._id))
        }
      },
    []
  )
}
