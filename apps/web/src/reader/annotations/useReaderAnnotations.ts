import type { ReactReaderProviderProps } from "@prose-reader/react-reader"
import { useAnnotations } from "../../annotations/useAnnotations"
import {
  applyAnnotationWrite,
  usePendingAnnotationWrites,
  useWriteAnnotation,
} from "../../annotations/useWriteAnnotation"

type ReaderAnnotations = Pick<
  ReactReaderProviderProps,
  | "annotations"
  | "onAnnotationCreate"
  | "onAnnotationUpdate"
  | "onAnnotationDelete"
>

/**
 * The stored annotations of the book, with the writes that have not landed
 * yet applied over them: react-reader sees each action at once, whatever the
 * write takes.
 */
export const useReaderAnnotations = ({
  bookId,
  enabled,
}: {
  bookId: string
  enabled: boolean
}): ReaderAnnotations => {
  const { data: storedAnnotations } = useAnnotations({ bookId, enabled })
  const pendingWrites = usePendingAnnotationWrites({ bookId })
  const { mutate: writeAnnotation } = useWriteAnnotation({ bookId })

  if (!enabled) return {}

  return {
    annotations:
      storedAnnotations &&
      pendingWrites.reduce(applyAnnotationWrite, storedAnnotations),
    onAnnotationCreate: function writeCreatedAnnotation(annotation) {
      writeAnnotation({ type: "create", annotation })
    },
    onAnnotationUpdate: function writeUpdatedAnnotation(annotation) {
      writeAnnotation({ type: "update", annotation })
    },
    onAnnotationDelete: function writeRemovedAnnotation(id) {
      writeAnnotation({ type: "remove", id })
    },
  }
}
