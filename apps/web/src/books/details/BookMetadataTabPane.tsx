import { memo } from "react"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  styled,
} from "@mui/material"
import { AutoFixHighRounded, ChevronRightRounded } from "@mui/icons-material"
import { Link } from "react-router"
import { useBook } from "../states"
import { useResolvedMetadataFetchEnabled } from "../../metadata/useResolvedMetadataFetchEnabled"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"
import { MetadataSourcePane } from "./MetadataSourcePane"
import { BookMetadataPolicyPane } from "../metadata/BookMetadataPolicyPane"
import { DataSourceSection } from "./DataSourceSection"
import {
  BOOK_OPTIMIZE_TABS,
  getBookOptimizeRoute,
} from "../../pages/books/$id/optimize/BookOptimizeScreen"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"

type Props = {
  bookId: string
}

const TabStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

// Cast preserves ListItemButton's polymorphic `component` prop (used to
// render as a react-router `Link`), which MUI's `styled` otherwise erases.
const ActionListItemButton = styled(ListItemButton)({}) as typeof ListItemButton

export const BookMetadataTabPane = memo(function BookMetadataTabPane({
  bookId,
}: Props) {
  const { data: book } = useBook({ id: bookId })
  const {
    override: metadataFetchOverride,
    isProtected: metadataFetchIsProtected,
    resolved: metadataFetchResolved,
  } = useResolvedMetadataFetchEnabled({ kind: "book", book })
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()
  const refreshMetadata = useRefreshBookMetadata()

  return (
    <TabStack>
      <List dense disablePadding>
        <ListItem disablePadding>
          <ActionListItemButton
            component={Link}
            to={getBookOptimizeRoute({
              bookId,
              tab: BOOK_OPTIMIZE_TABS.METADATA,
            })}
          >
            <ListItemIcon>
              <AutoFixHighRounded />
            </ListItemIcon>
            <ListItemText
              primary="Fix metadata in file"
              secondary="Edit metadata embedded in the downloaded book file."
            />
            <ChevronRightRounded />
          </ActionListItemButton>
        </ListItem>
      </List>
      <MetadataSourcePane bookId={bookId} />
      <BookMetadataPolicyPane
        override={metadataFetchOverride}
        isProtected={metadataFetchIsProtected}
        resolved={metadataFetchResolved}
        onChange={(next) => {
          if (!book) return
          incrementalBookPatch({
            doc: book._id,
            patch: { metadataFetchEnabled: next },
          })
        }}
        fileDownloadOverride={book?.metadataFileDownloadEnabled}
        onFileDownloadChange={(next) => {
          if (!book) return
          incrementalBookPatch({
            doc: book._id,
            patch: { metadataFileDownloadEnabled: next },
          })
        }}
        onForceRefresh={() => {
          refreshMetadata(bookId, { force: true })
        }}
        forceRefreshDisabled={book?.metadataUpdateStatus === "fetching"}
      />
      <DataSourceSection bookId={bookId} />
    </TabStack>
  )
})
