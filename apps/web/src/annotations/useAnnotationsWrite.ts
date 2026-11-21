import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type Database, ensureDatabase, useDatabase } from "../rxdb"
import { createAnnotationsQueryOptions } from "./useAnnotations"

/**
 * A write of the annotations of a book. `changeList` gives the list of the
 * book at once, before the write ends, and a failed write puts the previous
 * list back. The writes of a book run one after another, in the order of the
 * calls.
 */
export const useAnnotationsWrite = <Variables>({
  bookId,
  write,
  changeList,
}: {
  bookId: string
  write: (database: Database, variables: Variables) => Promise<unknown>
  changeList: (annotations: Annotation[], variables: Variables) => Annotation[]
}) => {
  const { db } = useDatabase()
  const queryClient = useQueryClient()
  const { queryKey } = createAnnotationsQueryOptions(bookId)

  return useMutation({
    scope: { id: `annotations:${bookId}` },
    mutationFn: async function writeAnnotations(variables: Variables) {
      return write(ensureDatabase(db), variables)
    },
    onMutate: function changeListAtOnce(variables) {
      // No cancelQueries: cancelling the live query stops its stream.
      const previousAnnotations = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(
        queryKey,
        (annotations) => annotations && changeList(annotations, variables),
      )

      return { previousAnnotations }
    },
    onError: function restorePreviousList(_error, _variables, context) {
      queryClient.setQueryData(queryKey, context?.previousAnnotations)
    },
  })
}
