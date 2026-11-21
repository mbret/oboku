import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

/** Stores the color and the note that react-reader reports for an annotation. */
export const useUpdateAnnotation = () =>
  useMutation$({
    mutationFn: function patchAnnotation({
      id,
      highlightColor,
      notes,
    }: Pick<Annotation, "id" | "highlightColor" | "notes">) {
      return getLatestDatabase().pipe(
        mergeMap((database) => from(database.annotation.findOne(id).exec())),
        throwIfNotDefined,
        mergeMap((annotation) =>
          from(
            annotation.incrementalPatch({
              highlightColor: highlightColor ?? null,
              notes: notes ?? null,
              modifiedAt: new Date().toISOString(),
            }),
          ),
        ),
      )
    },
  })
