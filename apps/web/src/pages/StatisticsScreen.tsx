import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Box, List, ListItem, ListItemText, ListSubheader } from "@mui/material"
import { useCollections } from "../collections/useCollections"
import { useBooks } from "../books/states"
import { PageContainer } from "../common/PageContainer"

export const StatisticsScreen = () => {
  const { data: books } = useBooks()
  const { data: collectionsAsArray = [] } = useCollections()

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        overflow: "scroll",
        flexDirection: "column",
      }}
    >
      <TopBarNavigation title={"Statistics"} />
      <PageContainer disableGutters>
        <List>
          <ListSubheader disableSticky>Books</ListSubheader>
          <ListItem>
            <ListItemText primary="Total of books" secondary={books?.length} />
          </ListItem>
          <ListSubheader disableSticky>Collections</ListSubheader>
          <ListItem>
            <ListItemText
              primary="Total of collections"
              secondary={collectionsAsArray.length}
            />
          </ListItem>
        </List>
      </PageContainer>
    </Box>
  )
}
