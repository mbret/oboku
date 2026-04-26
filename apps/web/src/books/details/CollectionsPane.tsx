import { useNavigate } from "react-router"
import { getCollectionComputedMetadata } from "../../collections/getCollectionComputedMetadata"
import { useCollections } from "../../collections/useCollections"
import { useBook } from "../states"
import { MetadataItemList } from "./MetadataItemList"
import { ROUTES } from "../../navigation/routes"

export const CollectionsPane = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })
  const navigate = useNavigate()
  const { data: collections } = useCollections({
    ids: book?.collections ?? [],
  })

  return (
    <MetadataItemList
      label="Member of collections"
      values={collections?.map((item) => ({
        label: getCollectionComputedMetadata(item).title,
        to: ROUTES.COLLECTION_DETAILS.replace(":id", item._id),
      }))}
      emptyLabel="None yet"
      onEditClick={() => {
        if (book?._id) {
          navigate(ROUTES.BOOK_COLLECTIONS.replace(":id", book._id))
        }
      }}
    />
  )
}
