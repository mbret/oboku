import { useCallback, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
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
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile({
    meta: { suppressGlobalErrorToast: true },
  })
  const { mutateAsync: downloadBook } = useDownloadBook({
    meta: { suppressGlobalErrorToast: true },
  })
  const bookLinks = useMemo(
    function copyBookLinks() {
      return [...book.links]
    },
    [book.links],
  )
  // Local-only books have no data source to re-download from, so reverting
  // (which deletes the local file) would lose it permanently.
  const canRevert = link.type !== PLUGIN_FILE_TYPE

  const { mutate: revert, isPending: isReverting } = useMutation({
    mutationFn: async function restoreOriginalDownload() {
      await removeDownloadFile({ bookId })
      await downloadBook({ _id: bookId, links: bookLinks })
    },
    onError: function reportRevertError(error) {
      notifyError(error)
    },
  })

  const revertLocalChanges = useCallback(
    async function confirmAndRevertLocalChanges() {
      if (isReverting || !canRevert) return

      const isConfirmed = await showConfirmDialog({
        message:
          "This will discard your local changes and re-download the original file from the data source.",
      })

      if (!isConfirmed) return

      revert()
    },
    [canRevert, isReverting, revert],
  )

  return { revertLocalChanges, isReverting, canRevert }
}
