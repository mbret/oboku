import { MangoQuery } from "rxdb"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyArray, MangoQueryNoLimit } from "rxdb/dist/types/types"
import { Database } from "../rxdb"
import { map, of, switchMap } from "rxjs"
import { intersection } from "lodash"

export const observeBook = ({
  db,
  queryObj
}: {
  db: Database
  queryObj?: string | MangoQueryNoLimit<BookDocType> | undefined
}) => {
  return db.book.findOne(queryObj).$
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
  const finalQueryObj: MangoQuery<BookDocType> = {
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
          $in: Array.from(ids)
        }
      })
    }
  }

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
