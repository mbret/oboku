import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useUpdateAnnotation = () =>
  useMutation({
    mutationFn: async function patchAnnotation({
      id,
      highlightColor,
      notes,
    }: Pick<Annotation, "id" | "highlightColor" | "notes">) {
      const database = await firstValueFrom(getLatestDatabase())

      return database.annotation.findOne(id).incrementalPatch({
        highlightColor: highlightColor ?? null,
        notes: notes ?? null,
        modifiedAt: new Date().toISOString(),
      })
    },
  })
