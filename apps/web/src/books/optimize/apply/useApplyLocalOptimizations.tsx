import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { BehaviorSubject } from "rxjs"
import { dexieDb } from "../../../rxdb/dexie"
import { getBookFile } from "../../../download/getBookFile.shared"
import { produceOptimizedFile } from "./produceOptimizedFile"
import { FILE_INSPECTION_QUERY_KEY } from "../useFileInspection"
import type { OptimizeOperation } from "./operations"

type ApplyLocalVariables = {
  bookId: string
  operations: OptimizeOperation[]
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
    mutationFn: async ({ bookId, operations }: ApplyLocalVariables) => {
      const cached = await getBookFile(bookId)

      if (!cached) {
        throw new Error(`Cannot optimize: no cached file for book ${bookId}`)
      }

      const optimized = await produceOptimizedFile(cached.data, operations, {
        onCompressionProgress: (ratio) => compressionProgress$.next(ratio),
      })

      await saveDownloadedFile(bookId, optimized)
    },
    onSuccess: (_data, { bookId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...FILE_INSPECTION_QUERY_KEY, bookId],
      })
    },
  })

  return { ...mutation, compressionProgress$ }
}
