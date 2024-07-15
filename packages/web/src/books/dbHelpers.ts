import { MangoQuery } from "rxdb"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyArray } from "rxdb/dist/types/types"
import { Database } from "../rxdb"
import { map, of, switchMap } from "rxjs"
import { intersection } from "lodash"

export const getBooksQueryObj = ({
  queryObj = {},
  isNotInterested,
  ids
}: {
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
} = {}) => {
  const finalQueryObj = {
    ...queryObj,
    selector: {
      ...queryObj.selector,
      ...(isNotInterested === "none" && {
        isNotInterested: {
          $ne: true
        }
      }),
      ...(isNotInterested === "only" && {
        isNotInterested: {
          $eq: true
        }
      }),
      ...(ids && {
        _id: {
          $in: ids
        }
      })
    }
  } satisfies MangoQuery<BookDocType>

  return finalQueryObj
}

export const observeBooks = ({
  db,
  queryObj = {},
  isNotInterested,
  ids,
  includeProtected
}: {
  db: Database
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
  includeProtected: boolean
}) => {
  const finalQueryObj = getBooksQueryObj({
    ids,
    isNotInterested,
    queryObj
  })

  const protectedTags = db.tag.find({
    selector: {
      isProtected: {
        $eq: true
      }
    }
  })

  const books$ = db.book.find(finalQueryObj).$

  return books$.pipe(
    switchMap((books) => {
      if (includeProtected) return of(books)

      return protectedTags.$.pipe(
        map((protectedTags) => {
          const protectedTagIds = protectedTags.map(({ _id }) => _id)

          return books?.filter(
            (book) =>
              intersection(protectedTagIds, book?.tags || []).length === 0
          )
        })
      )
    })
  )
}
