import type { ModifyFunction, RxDocument } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { incrementalBookMutation } from "./incrementalBookMutation"

export const useIncrementalBookModify = () =>
  useMutation$({
    mutationFn: ({
      doc,
      mutationFn,
    }: {
      doc: RxDocument<BookDocType> | string
      mutationFn: ModifyFunction<BookDocType>
    }) =>
      incrementalBookMutation(doc, (item) =>
        item.incrementalModify(mutationFn),
      ),
  })
