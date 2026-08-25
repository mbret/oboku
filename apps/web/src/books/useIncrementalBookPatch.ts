import type { RxDocument } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import type { UseMutationOptions } from "@tanstack/react-query"
import { useMutation$ } from "reactjrx"
import { incrementalBookMutation } from "./incrementalBookMutation"

export const useIncrementalBookPatch = (
  options?: Pick<UseMutationOptions, "meta">,
) =>
  useMutation$({
    ...options,
    mutationFn: ({
      doc,
      patch,
    }: {
      doc: RxDocument<BookDocType> | string
      patch: Partial<BookDocType>
    }) => incrementalBookMutation(doc, (item) => item.incrementalPatch(patch)),
  })
