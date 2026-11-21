import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useCreateAnnotation = () =>
  useMutation({
    mutationFn: async function insertAnnotation({
      bookId,
      annotation,
    }: {
      bookId: string
      annotation: Annotation
    }) {
      const database = await firstValueFrom(getLatestDatabase())

      return database.annotation.insert({
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
