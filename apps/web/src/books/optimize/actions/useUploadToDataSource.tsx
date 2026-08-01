import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { getBookFile } from "../../../download/getBookFile.shared"
import { usePluginUpsertFile } from "../../../plugins/usePluginUpsertFile"
import { showConfirmDialog } from "../../../common/dialogs/presets"
import { CancelError } from "../../../errors/errors.shared"
import { notify, notifyError } from "../../../notifications/toasts"

export const useUploadToDataSource = ({
  book,
  link,
  enabled,
}: {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  enabled: boolean
}) => {
  const bookId = book._id
  const {
    mutateAsync: upsertFile,
    slot,
    progress$: uploadProgress$,
  } = usePluginUpsertFile()

  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      const cached = await getBookFile(bookId)

      if (!cached) {
        throw new Error(`Cannot upload: no cached file for book ${bookId}`)
      }

      const file = cached.data

      await upsertFile({
        link,
        file,
        fileName: file.name,
        contentType: file.type,
      })
    },
  })

  const canUpload = enabled && !isUploading

  const uploadToDataSource = useCallback(async () => {
    if (!canUpload) return

    const isConfirmed = await showConfirmDialog({
      message:
        "This will overwrite the file on the remote data source with the current local file.",
    })

    if (!isConfirmed) return

    uploadFile(undefined, {
      onSuccess: () => {
        notify({
          title: "Upload complete",
          description: "The file was uploaded to the data source.",
          severity: "success",
        })
      },
      onError: (error) => {
        if (error instanceof CancelError) return
        notifyError(error)
      },
    })
  }, [canUpload, uploadFile])

  return { uploadToDataSource, isUploading, canUpload, slot, uploadProgress$ }
}
