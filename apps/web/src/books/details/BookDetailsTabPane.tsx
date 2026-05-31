import { memo } from "react"
import {
  Alert,
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
import { MetadataPane } from "./MetadataPane"
import { CollectionsPane } from "./CollectionsPane"
import { BOOK_OPTIMIZE_TABS, getBookOptimizeRoute } from "../optimize/tabs"

type Props = {
  bookId: string
}

const SectionStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}))

const PaddedStack = styled(Stack)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  gap: theme.spacing(1),
}))

export const BookDetailsTabPane = memo(function BookDetailsTabPane({
  bookId,
}: Props) {
  const { data: book } = useBook({ id: bookId })

  return (
    <SectionStack>
      {book?.metadataUpdateStatus === "fetching" && (
        <PaddedStack>
          <Alert severity="warning">Retrieving metadata information...</Alert>
        </PaddedStack>
      )}
      <List dense disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to={getBookOptimizeRoute({
              bookId,
              tab: BOOK_OPTIMIZE_TABS.CONTENT,
            })}
          >
            <ListItemIcon>
              <AutoFixHighRounded />
            </ListItemIcon>
            <ListItemText
              primary="Optimize your book"
              secondary="Improve and tune the downloaded book file content."
            />
            <ChevronRightRounded />
          </ListItemButton>
        </ListItem>
      </List>
      <PaddedStack>
        <MetadataPane bookId={bookId} />
        <CollectionsPane bookId={bookId} />
      </PaddedStack>
    </SectionStack>
  )
})
