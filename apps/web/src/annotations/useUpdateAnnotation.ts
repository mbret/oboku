import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useAnnotationsWrite } from "./useAnnotationsWrite"

export const useUpdateAnnotation = ({ bookId }: { bookId: string }) =>
  useAnnotationsWrite({
    bookId,
    write: function patchAnnotation(
      database,
      {
        id,
        highlightColor,
        notes,
      }: Pick<Annotation, "id" | "highlightColor" | "notes">,
    ) {
      return database.annotation.findOne(id).incrementalPatch({
        highlightColor: highlightColor ?? null,
        notes: notes ?? null,
        modifiedAt: new Date().toISOString(),
      })
    },
    changeList: function mergeAnnotation(
      annotations,
      { id, highlightColor, notes },
    ) {
      return annotations.map((annotation) =>
        annotation.id === id
          ? { ...annotation, highlightColor, notes }
          : annotation,
      )
    },
  })
