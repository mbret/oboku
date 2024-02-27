import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../rxdb/useCreateDatabase"
import { from, mergeMap } from "rxjs"
import { useUpdateBooks } from "../books/useUpdateBooks"

export const useUpdateCollectionBooks = () => {
  const { mutateAsync: updateBooks } = useUpdateBooks()

  return useMutation({
    mutationFn: ({
      id,
      updateObj
    }: {
      id: string
      updateObj: any
    }) =>
      getLatestDatabase().pipe(
        mergeMap((database) =>
          from(
            database.obokucollection
              .findOne({
                selector: {
                  _id: {
                    $eq: id
                  }
                }
              })
              .exec()
          )
        ),
        mergeMap((collection) => {
          if (!collection) throw new Error("no item")

          return from(
            updateBooks({
              queryObj: {
                selector: {
                  _id: {
                    $in: collection.books
                  }
                }
              },
              updateObj
            })
          )
        })
      )
  })
}
