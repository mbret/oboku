import { Box } from "@mui/material"
import { truncate } from "lodash"
import { useParams } from "react-router-dom"
import { BookList } from "../books/bookList/BookList"
import { CollectionList } from "../collections/list/CollectionList"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useDatabase } from "../rxdb"
import { useBooks, useCollections } from "./states"

const getTitle = (type?: string) => {
  switch (type) {
    case "collection":
      return "Collection"
    default:
      return "Book"
  }
}

export const SearchScreenExpanded = () => {
  const { type, search } = useParams()
  const { db$ } = useDatabase()
  const collections = useCollections(db$, search ?? "")
  const books = useBooks(db$, search ?? "")

  return (
    <>
      <TopBarNavigation
        showBack
        goBackDefaultTo=".."
        title={`${getTitle(type)} results for "${truncate(search, {
          length: 6
        })}"`}
      />
      {type === "book" && (
        <BookList data={books} viewMode="list" style={{ height: "100%" }} />
      )}
      {type === "collection" && (
        <CollectionList
          data={collections}
          viewMode="list"
          style={{ height: "100%" }}
        />
      )}
    </>
  )
}
