import {
  updateArchive,
  type WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import { useRef } from "react"
import { BehaviorSubject } from "rxjs"
import { dexieDb } from "../../../rxdb/dexie"
import { getBookFile } from "../../../download/getBookFile.shared"
import { FILE_INSPECTION_QUERY_KEY } from "../useFileInspection"

type ApplyLocalVariables = {
  bookId: string
  actions: WebArchiveUpdateAction[]
}

const saveDownloadedFile = async (bookId: string, file: File) => {
  await dexieDb.downloads.put({
    id: bookId,
    data: file,
    filename: file.name,
  })
}

export const useApplyLocalOptimizations = () => {
  const queryClient = useQueryClient()
  const compressionProgress$ = useRef(new BehaviorSubject(0)).current

  const mutation = useMutation({
    mutationFn: async ({ bookId, actions }: ApplyLocalVariables) => {
      compressionProgress$.next(0)

      const cached = await getBookFile(bookId)

      if (!cached) {
        throw new Error(`Cannot optimize: no cached file for book ${bookId}`)
      }

      const file = cached.data
      const archive = await createArchiveFromZipJs(
        new ZipReader(new BlobReader(file)),
      )

      try {
        const { blob, mimeType, dispose } = await updateArchive(archive, {
          actions,
          sourceMimeType: file.type,
          onProgress: ({ completed, total }) => {
            compressionProgress$.next(total > 0 ? completed / total : 0)
          },
        })

        try {
          await saveDownloadedFile(
            bookId,
            new File([blob], file.name, { type: mimeType }),
          )
        } finally {
          await dispose()
        }
      } finally {
        await archive.close()
      }
    },
    onSuccess: (_data, { bookId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...FILE_INSPECTION_QUERY_KEY, bookId],
      })
    },
  })

  return { ...mutation, compressionProgress$ }
}
