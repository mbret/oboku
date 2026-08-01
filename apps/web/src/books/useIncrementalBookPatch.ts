import type { RxDocument } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { incrementalBookMutation } from "./incrementalBookMutation"

export const useIncrementalBookPatch = () =>
  useMutation$({
    mutationFn: ({
      doc,
      patch,
    }: {
      doc: RxDocument<BookDocType> | string
      patch: Partial<BookDocType>
    }) => incrementalBookMutation(doc, (item) => item.incrementalPatch(patch)),
  })
