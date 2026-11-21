import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation } from "@tanstack/react-query"
import { ensureDatabase, useDatabase } from "../rxdb"

export const useCreateAnnotation = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async function insertAnnotation({
      bookId,
      annotation,
    }: {
      bookId: string
      annotation: Annotation
    }) {
      return ensureDatabase(db).annotation.insert({
        _id: annotation.id,
        rx_model: "annotation",
        bookId,
        cfi: annotation.cfi,
        highlightColor: annotation.highlightColor ?? null,
        notes: annotation.notes ?? null,
        highlightedText: annotation.highlightedText ?? null,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      })
    },
  })
}
