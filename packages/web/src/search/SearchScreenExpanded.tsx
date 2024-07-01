import { truncate } from "lodash"
import { useParams } from "react-router-dom"
import { BookList } from "../books/bookList/BookList"
import { CollectionList } from "../collections/list/CollectionList"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useCollectionsForSearch } from "./useCollectionsForSearch"
import { useBooksForSearch } from "./useBooksForSearch"

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
  const { data: collections = [] } = useCollectionsForSearch(search ?? "")
  const { data: books = [] } = useBooksForSearch(search ?? "")

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
