import { type PathParam, useParams } from "react-router"
import { BookList } from "../books/lists"
import { CollectionList } from "../collections/lists/CollectionList"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import type { ROUTES } from "../navigation/routes"
import { useCollectionsForSearch } from "./useCollectionsForSearch"
import { useBooksForSearch } from "./useBooksForSearch"
import { ListActionsToolbar } from "./list/ListActionsToolbar"
import { truncate } from "@oboku/shared"

const getTitle = (type?: string) => {
  switch (type) {
    case "collection":
      return "Collection"
    default:
      return "Book"
  }
}

export const SearchScreenExpanded = () => {
  const { type, search } = useParams<PathParam<typeof ROUTES.SEARCH_RESULTS>>()
  const { data: collections = [] } = useCollectionsForSearch(search ?? "")
  const { data: books = [] } = useBooksForSearch(search ?? "")

  return (
    <>
      <TopBarNavigation
        showBack
        goBackDefaultTo=".."
        title={`${getTitle(type)} results for "${truncate(search, {
          length: 6,
        })}"`}
      />
      <ListActionsToolbar />
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
