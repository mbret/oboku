import type { MangoQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import type {
  DeepReadonlyArray,
  MangoQueryNoLimit,
} from "rxdb/dist/types/types"
import type { Database } from "../rxdb"
import { map, of, switchMap } from "rxjs"
import { intersection } from "@oboku/shared"

export const getBookById = async ({
  database,
  id,
}: {
  database: Database
  id: string
}) => {
  const book = await database.collections.book
    .findOne({
      selector: {
        _id: id,
      },
    })
    .exec()

  return book?.toJSON()
}

export const observeBook = ({
  db,
  queryObj,
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
  includeProtected,
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
          $ne: true,
        },
      }),
      ...(isNotInterested === "only" && {
        isNotInterested: {
          $eq: true,
        },
      }),
      ...(ids && {
        _id: {
          $in: Array.from(ids),
        },
      }),
    },
  }

  const protectedTags = db.tag.find({
    selector: {
      isProtected: {
        $eq: true,
      },
    },
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
              intersection(protectedTagIds, book?.tags || []).length === 0,
          )
        }),
      )
    }),
  )
}
