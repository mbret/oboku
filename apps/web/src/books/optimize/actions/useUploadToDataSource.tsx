import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { getBookFile } from "../../../download/getBookFile.shared"
import { usePluginUpsertFile } from "../../../plugins/usePluginUpsertFile"
import { pluginsByType } from "../../../plugins/configure"
import { notify } from "../../../notifications/toasts"
import { useRefreshBookMetadata } from "../../useRefreshBookMetadata"
import { confirmUploadToDataSource } from "./confirmUploadToDataSource"

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
  const plugin = pluginsByType[link.type]
  const refreshBookMetadata = useRefreshBookMetadata()
  const {
    mutateAsync: upsertFile,
    slot,
    progress$: uploadProgress$,
  } = usePluginUpsertFile({
    meta: { suppressGlobalErrorToast: true },
  })

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
    /**
     * Not awaited: the refresh reports its own outcome and the upload is
     * already complete, so its failure must not read as an upload failure.
     */
    onSuccess: function refreshMetadataDerivedFromUploadedFile() {
      void refreshBookMetadata(bookId)
    },
  })

  const canUpload = enabled && !isUploading

  const uploadToDataSource = useCallback(async () => {
    if (!canUpload) return

    const isConfirmed = await confirmUploadToDataSource({
      providerName: plugin.name,
      prunesVersionHistory: plugin.upsertPrunesVersionHistory ?? false,
    })

    if (!isConfirmed) return

    uploadFile(undefined, {
      onSuccess: () => {
        notify({
          title: "Upload complete",
          description:
            "The file was uploaded to the data source. Its metadata is being refreshed.",
          severity: "success",
        })
      },
    })
  }, [canUpload, plugin, uploadFile])

  return { uploadToDataSource, isUploading, canUpload, slot, uploadProgress$ }
}
