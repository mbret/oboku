import type { RxDocument, UpdateQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import type { UseMutationOptions } from "@tanstack/react-query"
import { useMutation$ } from "reactjrx"
import { incrementalBookMutation } from "./incrementalBookMutation"

export const useIncrementalBookUpdate = (
  options?: Pick<UseMutationOptions, "meta">,
) =>
  useMutation$({
    ...options,
    mutationFn: ({
      doc,
      updateObj,
    }: {
      doc: RxDocument<BookDocType> | string
      updateObj: UpdateQuery<BookDocType>
    }) =>
      incrementalBookMutation(doc, (item) => item.incrementalUpdate(updateObj)),
  })
