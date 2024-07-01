import { getMetadataFromCollection } from "../../collections/getMetadataFromCollection"
import { useCollectionsWithPrivacy } from "../../collections/states"
import { ROUTES } from "../../constants"
import { useManageBookCollectionsDialog } from "../ManageBookCollectionsDialog"
import { useBook } from "../states"
import { MetadataItemList } from "./MetadataItemList"

export const CollectionsPane = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })
  const { openManageBookCollectionsDialog } = useManageBookCollectionsDialog()
  const { data: collections } = useCollectionsWithPrivacy({
    queryObj: {
      selector: {
        _id: {
          $in: book?.collections
        }
      }
    }
  })

  return (
    <MetadataItemList
      label="Member of collections"
      values={collections?.map((item) => ({
        label: getMetadataFromCollection(item).title,
        to: ROUTES.COLLECTION_DETAILS.replace(":id", item._id)
      }))}
      emptyLabel="None yet"
      onEditClick={() => {
        book?._id && openManageBookCollectionsDialog(book?._id)
      }}
    />
  )
}
