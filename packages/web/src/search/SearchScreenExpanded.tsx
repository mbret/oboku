import { truncate } from "lodash"
import { useParams } from "react-router-dom"
import { BookList } from "../books/bookList/BookList"
import { CollectionList } from "../collections/list/CollectionList"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useBooks, useCollections } from "./states"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

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
  const collections = useCollections(latestDatabase$, search ?? "")
  const books = useBooks(latestDatabase$, search ?? "")

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
