import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import type { RxDocument, UpdateQuery } from "rxdb"
import type { CollectionDocType } from "@oboku/shared"
import type { UseMutationOptions } from "@tanstack/react-query"
import { useMutation$ } from "reactjrx"

export const useCollectionIncrementalUpdate = (
  options?: Pick<UseMutationOptions, "meta">,
) =>
  useMutation$({
    ...options,
    mutationFn: ({
      doc,
      updateObj,
    }: {
      doc: RxDocument<CollectionDocType> | string
      updateObj: UpdateQuery<CollectionDocType>
    }) =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          typeof doc === "string"
            ? from(
                db.obokucollection.findOne({ selector: { _id: doc } }).exec(),
              )
            : of(doc),
        ),
        mergeMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalUpdate(updateObj))
        }),
      ),
  })
