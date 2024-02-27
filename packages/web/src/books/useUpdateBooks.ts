import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../rxdb/useCreateDatabase"
import { from, mergeMap } from "rxjs"
import { MangoQuery } from "rxdb"
import { BookDocType } from "@oboku/shared"

export const useUpdateBooks = () => {
  return useMutation({
    mutationFn: ({
      queryObj,
      updateObj
    }: {
      queryObj: MangoQuery<BookDocType>
      updateObj: any
    }) =>
      getLatestDatabase().pipe(
        mergeMap((database) => {
          const query = database.book.find(queryObj)

          return from(query.update(updateObj))
        })
      )
  })
}
