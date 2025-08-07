import type { MangoQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import type {
  DeepReadonlyArray,
  MangoQueryNoLimit,
} from "rxdb/dist/types/types"
import type { Database } from "../rxdb"
import { combineLatest, map } from "rxjs"
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
  protected: _protected,
}: {
  db: Database
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
  protected: "only" | "with" | "none"
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

  const protectedTags$ = db.tag.find({
    selector: {
      isProtected: {
        $eq: true,
      },
    },
  }).$

  const books$ = db.book.find(finalQueryObj).$

  return combineLatest([books$, protectedTags$]).pipe(
    map(([books, protectedTags]) => {
      if (_protected === "with") return books

      const protectedTagIds = protectedTags.map(({ _id }) => _id)

      return books?.filter((book) => {
        const tagsInCommon = intersection(protectedTagIds, book?.tags || [])

        if (_protected === "only") return tagsInCommon.length >= 1

        return tagsInCommon.length === 0
      })
    }) ?? [],
  )
}
