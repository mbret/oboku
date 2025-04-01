import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap } from "rxjs"
import type { UpdateQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"

export const useUpdateCollectionBooks = () => {
  return useMutation$({
    mutationFn: ({
      id,
      updateObj,
    }: {
      id: string
      updateObj: UpdateQuery<BookDocType>
    }) =>
      getLatestDatabase().pipe(
        mergeMap((database) =>
          from(
            database.obokucollection
              .findOne({
                selector: {
                  _id: {
                    $eq: id,
                  },
                },
              })
              .exec(),
          ).pipe(
            mergeMap((collection) => {
              if (!collection) throw new Error("no item")

              return from(
                database.book
                  .find({
                    selector: {
                      _id: {
                        $in: collection.books,
                      },
                    },
                  })
                  .update(updateObj),
              )
            }),
          ),
        ),
      ),
  })
}
