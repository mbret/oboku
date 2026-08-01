import type { RxDocument, UpdateQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { incrementalBookMutation } from "./incrementalBookMutation"

export const useIncrementalBookUpdate = () =>
  useMutation$({
    mutationFn: ({
      doc,
      updateObj,
    }: {
      doc: RxDocument<BookDocType> | string
      updateObj: UpdateQuery<BookDocType>
    }) =>
      incrementalBookMutation(doc, (item) => item.incrementalUpdate(updateObj)),
  })
