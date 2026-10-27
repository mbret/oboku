import { generatePath, useNavigate } from "react-router"
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
        to: generatePath(ROUTES.COLLECTION_DETAILS, { id: item._id }),
      }))}
      emptyLabel="None yet"
      onEditClick={() => {
        if (book?._id) {
          navigate(generatePath(ROUTES.BOOK_COLLECTIONS, { id: book._id }))
        }
      }}
    />
  )
}
