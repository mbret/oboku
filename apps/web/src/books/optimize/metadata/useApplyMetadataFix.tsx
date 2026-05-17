import { useMutation } from "@tanstack/react-query"
import type { LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { dexieDb } from "../../../rxdb/dexie"
import { Logger } from "../../../debug/logger.shared"
import { getBookFile } from "../../../download/getBookFile.shared"
import { patchArchiveFile } from "./archiveFile"
import { usePluginUpsertFile } from "../../../plugins/usePluginUpsertFile"
import type { ArchiveMetadataPatchPlan } from "./targets"

type ApplyMetadataFixVariables = {
  bookId: string
  link: DeepReadonlyObject<LinkDocType> | LinkDocType
  patches: ArchiveMetadataPatchPlan[]
  uploadToDataSource: boolean
}

const saveDownloadedFile = async (bookId: string, file: File) => {
  await dexieDb.downloads.put({
    id: bookId,
    data: file,
    filename: file.name,
  })
}

export const useApplyMetadataFix = () => {
  const {
    mutateAsync: upsertFile,
    slot,
    progress$: uploadProgress$,
  } = usePluginUpsertFile()

  const mutation = useMutation({
    mutationFn: async ({
      bookId,
      link,
      patches,
      uploadToDataSource,
    }: ApplyMetadataFixVariables) => {
      const cached = await getBookFile(bookId)

      if (!cached) {
        throw new Error(
          `Cannot apply metadata: no cached file for book ${bookId}`,
        )
      }

      const file = cached.data

      const mutated = await patchArchiveFile(file, patches)

      const mutatedFile = new File([mutated], file.name, {
        type: mutated.type,
      })

      if (!uploadToDataSource) {
        await saveDownloadedFile(bookId, mutatedFile)

        return { uploadedToDataSource: false }
      }

      await upsertFile({
        link,
        file: mutatedFile,
        fileName: mutatedFile.name,
        contentType: mutatedFile.type,
      })

      try {
        await saveDownloadedFile(bookId, mutatedFile)
      } catch (error) {
        Logger.error(
          `Failed to update local download cache after metadata fix for book ${bookId}`,
          error,
        )
      }

      return { uploadedToDataSource: true }
    },
  })

  return { ...mutation, slot, uploadProgress$ }
}
