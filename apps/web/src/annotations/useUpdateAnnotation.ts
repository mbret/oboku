import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation } from "@tanstack/react-query"
import { ensureDatabase, useDatabase } from "../rxdb"

export const useUpdateAnnotation = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async function patchAnnotation({
      id,
      highlightColor,
      notes,
    }: Pick<Annotation, "id" | "highlightColor" | "notes">) {
      return ensureDatabase(db)
        .annotation.findOne(id)
        .incrementalPatch({
          highlightColor: highlightColor ?? null,
          notes: notes ?? null,
          modifiedAt: new Date().toISOString(),
        })
    },
  })
}
