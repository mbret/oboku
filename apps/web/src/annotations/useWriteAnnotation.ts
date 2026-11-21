import type { Annotation } from "@prose-reader/enhancer-annotations"
import {
  type Mutation,
  matchMutation,
  useMutation,
  useMutationState,
} from "@tanstack/react-query"
import { isDefined } from "reactjrx"
import { type Database, ensureDatabase, useDatabase } from "../rxdb"

/** An annotation action react-reader reports, as one value to write. */
export type AnnotationWrite =
  | { type: "create"; annotation: Annotation }
  | {
      type: "update"
      annotation: Pick<Annotation, "id" | "highlightColor" | "notes">
    }
  | { type: "remove"; id: string }

const getAnnotationWriteMutationKey = (bookId: string) => [
  "annotations",
  "write",
  bookId,
]

type AnnotationWriteMutation = Mutation & {
  state: Mutation["state"] & { variables: AnnotationWrite }
}

const isAnnotationWriteOfBook = (
  bookId: string,
  mutation: Mutation,
): mutation is AnnotationWriteMutation =>
  matchMutation(
    { exact: true, mutationKey: getAnnotationWriteMutationKey(bookId) },
    mutation,
  )

const writeAnnotation = (
  database: Database,
  bookId: string,
  write: AnnotationWrite,
) => {
  switch (write.type) {
    case "create":
      return database.annotation.insert({
        _id: write.annotation.id,
        rx_model: "annotation",
        bookId,
        cfi: write.annotation.cfi,
        highlightColor: write.annotation.highlightColor ?? null,
        notes: write.annotation.notes ?? null,
        highlightedText: write.annotation.highlightedText ?? null,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      })
    case "update":
      return database.annotation.findOne(write.annotation.id).incrementalPatch({
        highlightColor: write.annotation.highlightColor ?? null,
        notes: write.annotation.notes ?? null,
        modifiedAt: new Date().toISOString(),
      })
    case "remove":
      return database.annotation.findOne(write.id).incrementalRemove()
  }
}

/**
 * A create that the list already holds changes nothing, so a write can be
 * applied over a stored list that already has it.
 */
export const applyAnnotationWrite = (
  annotations: Annotation[],
  write: AnnotationWrite,
): Annotation[] => {
  switch (write.type) {
    case "create": {
      const isListed = annotations.some(
        (annotation) => annotation.id === write.annotation.id,
      )

      return isListed ? annotations : [...annotations, write.annotation]
    }
    case "update":
      return annotations.map((annotation) =>
        annotation.id === write.annotation.id
          ? { ...annotation, ...write.annotation }
          : annotation,
      )
    case "remove":
      return annotations.filter((annotation) => annotation.id !== write.id)
  }
}

/**
 * Writes the annotations of a book one after another, in the order of the
 * calls: a removal can name an annotation whose insert still runs.
 */
export const useWriteAnnotation = ({ bookId }: { bookId: string }) => {
  const { db } = useDatabase()
  const mutationKey = getAnnotationWriteMutationKey(bookId)

  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join(":") },
    mutationFn: async function writeAnnotationOfBook(write: AnnotationWrite) {
      return writeAnnotation(ensureDatabase(db), bookId, write)
    },
  })
}

/** The writes of a book that have not landed yet, in the order of the calls. */
export const usePendingAnnotationWrites = ({ bookId }: { bookId: string }) =>
  useMutationState({
    filters: {
      exact: true,
      mutationKey: getAnnotationWriteMutationKey(bookId),
      status: "pending",
    },
    select: function selectPendingWrite(mutation) {
      return isAnnotationWriteOfBook(bookId, mutation)
        ? mutation.state.variables
        : undefined
    },
  }).filter(isDefined)
