import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useUpdateAnnotation = () =>
  useMutation$({
    mutationFn: function patchAnnotation({
      id,
      highlightColor,
      notes,
    }: Pick<Annotation, "id" | "highlightColor" | "notes">) {
      return getLatestDatabase().pipe(
        mergeMap(function patchAnnotationIn(database) {
          return from(
            database.annotation.findOne(id).incrementalPatch({
              highlightColor: highlightColor ?? null,
              notes: notes ?? null,
              modifiedAt: new Date().toISOString(),
            }),
          )
        }),
      )
    },
  })
