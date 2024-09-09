import { getCollectionComputedMetadata } from "../../collections/getCollectionComputedMetadata"
import { useCollections } from "../../collections/useCollections"
import { ROUTES } from "../../constants.web"
import { useManageBookCollectionsDialog } from "../ManageBookCollectionsDialog"
import { useBook } from "../states"
import { MetadataItemList } from "./MetadataItemList"

export const CollectionsPane = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })
  const { openManageBookCollectionsDialog } = useManageBookCollectionsDialog()
  const { data: collections } = useCollections({
    ids: book?.collections ?? []
  })

  return (
    <MetadataItemList
      label="Member of collections"
      values={collections?.map((item) => ({
        label: getCollectionComputedMetadata(item).title,
        to: ROUTES.COLLECTION_DETAILS.replace(":id", item._id)
      }))}
      emptyLabel="None yet"
      onEditClick={() => {
        book?._id && openManageBookCollectionsDialog(book?._id)
      }}
    />
  )
}
