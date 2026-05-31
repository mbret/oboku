import { useMutation } from "@tanstack/react-query"
import type { LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { getBookFile } from "../../../download/getBookFile.shared"
import { usePluginUpsertFile } from "../../../plugins/usePluginUpsertFile"

type UploadVariables = {
  bookId: string
  link: DeepReadonlyObject<LinkDocType> | LinkDocType
}

export const useUploadToDataSource = () => {
  const {
    mutateAsync: upsertFile,
    slot,
    progress$: uploadProgress$,
  } = usePluginUpsertFile()

  const mutation = useMutation({
    mutationFn: async ({ bookId, link }: UploadVariables) => {
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

  return { ...mutation, slot, uploadProgress$ }
}
