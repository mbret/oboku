import { Box, List, ListItem, ListItemText, Stack } from "@mui/material"
import { TagsRow } from "./TagsRow"
import { DescriptionRow } from "./DescriptionRow"
import { MetadataItemList } from "./MetadataItemList"
import { useBook } from "../states"
import { getMetadataFromBook } from "../metadata"

export const MetadataPane = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })

  const metadata = getMetadataFromBook(book)

  return (
    <Box>
      <Stack gap={2}>
        <TagsRow bookId={book?._id} />
        <DescriptionRow bookId={book?._id} />
        <Stack flexDirection="row" gap={2} flexWrap="wrap">
          <MetadataItemList
            values={metadata.authors?.map((item) => ({ label: item }))}
            label="Authors"
          />
          <MetadataItemList
            values={[{ label: metadata.publisher }]}
            label="Publisher"
          />
        </Stack>
        <List
          sx={{ width: "100%", bgcolor: "background.paper" }}
          disablePadding
        >
          <ListItem disableGutters disablePadding>
            <ListItemText
              primary="Published date"
              secondary={metadata.displayableDate ?? "unknown"}
            />
          </ListItem>
          <ListItem disableGutters disablePadding>
            <ListItemText
              primary="Language"
              secondary={metadata.language ?? "unknown"}
            />
          </ListItem>
          <ListItem disableGutters disablePadding>
            <ListItemText
              primary="Subjects"
              secondary={metadata.subjects?.join(", ") ?? "unknown"}
            />
          </ListItem>
          <ListItem disableGutters disablePadding>
            <ListItemText
              primary="Page count"
              secondary={metadata.pageCount ?? "unknown"}
            />
          </ListItem>
        </List>
      </Stack>
    </Box>
  )
}
