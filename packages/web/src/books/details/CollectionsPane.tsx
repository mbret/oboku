import { getMetadataFromCollection } from "../../collections/getMetadataFromCollection"
import { useCollectionsWithPrivacy } from "../../collections/states"
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
      values={collections?.map((item) => getMetadataFromCollection(item).title)}
      emptyLabel="None yet"
      onEditClick={() => {
        book?._id && openManageBookCollectionsDialog(book?._id)
      }}
    />
  )
}
