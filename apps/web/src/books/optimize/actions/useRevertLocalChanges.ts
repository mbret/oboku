import { useCallback, useMemo, useState } from "react"
import {
  PLUGIN_FILE_TYPE,
  type BookDocType,
  type LinkDocType,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { notifyError } from "../../../notifications/toasts"
import { useDownloadBook } from "../../../download"
import { useRemoveDownloadFile } from "../../../download/useRemoveDownloadFile"

export const useRevertLocalChanges = ({
  book,
  link,
}: {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
}) => {
  const bookId = book._id
  const [isReverting, setIsReverting] = useState(false)
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()
  const { mutate: downloadBook } = useDownloadBook()
  const bookLinks = useMemo(() => [...book.links], [book.links])
  // Local-only books have no data source to re-download from, so reverting
  // (which deletes the local file) would lose it permanently.
  const canRevert = link.type !== PLUGIN_FILE_TYPE

  const revertLocalChanges = useCallback(async () => {
    if (isReverting || !canRevert) return

    const isConfirmed = await showConfirmDialog({
      message:
        "This will discard your local changes and re-download the original file from the data source.",
    })

    if (!isConfirmed) return

    setIsReverting(true)
    try {
      await removeDownloadFile({ bookId })
      downloadBook({ _id: bookId, links: bookLinks })
    } catch (error) {
      notifyError(error)
    } finally {
      setIsReverting(false)
    }
  }, [
    bookId,
    bookLinks,
    canRevert,
    downloadBook,
    isReverting,
    removeDownloadFile,
  ])

  return { revertLocalChanges, isReverting, canRevert }
}
