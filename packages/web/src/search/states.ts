import { sortByTitleComparator } from "@oboku/shared"
import { bind } from "@react-rxjs/core"
import { combineLatest, map, Observable, of, switchMap } from "rxjs"
import { Database } from "../rxdb"

export const REGEXP_SPECIAL_CHAR =
  /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g

export const [useCollections] = bind(
  (database$: Observable<Database>, search: string | Observable<string>) =>
    combineLatest([
      database$.pipe(
        switchMap((database) => database.collections.obokucollection.find().$)
      ),
      typeof search === "string" ? of(search) : search
    ]).pipe(
      map(([data, search]) => {
        if (!search) return []

        return data
          .filter(({ name }) => {
            const searchRegex = new RegExp(
              search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
              "i"
            )

            const indexOfFirstMatch = name?.search(searchRegex) || 0
            return indexOfFirstMatch >= 0
          })
          .sort((a, b) => sortByTitleComparator(a.name || "", b.name || ""))
      }),
      map((items) => items.map(({ _id }) => _id))
    ),
  []
)

export const [useBooks] = bind(
  (database$: Observable<Database>, search: string | Observable<string>) =>
    combineLatest([
      database$.pipe(
        switchMap((database) => database.collections.book.find().$)
      ),
      typeof search === "string" ? of(search) : search
    ]).pipe(
      map(([data, search]) => {
        if (!search) return []

        return data
          .filter(({ title }) => {
            const searchRegex = new RegExp(
              search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
              "i"
            )

            const indexOfFirstMatch = title?.search(searchRegex) || 0
            return indexOfFirstMatch >= 0
          })
          .sort((a, b) => sortByTitleComparator(a.title || "", b.title || ""))
      }),
      map((items) => items.map(({ _id }) => _id))
    ),
  []
)
