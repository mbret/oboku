import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Box, List, ListItem, ListItemText, ListSubheader } from "@mui/material"
import { useCollections } from "../collections/useCollections"
import { useBooks } from "../books/states"

export const StatisticsScreen = () => {
  const { data: books } = useBooks()
  const { data: collectionsAsArray = [] } = useCollections()

  return (
    <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
      <TopBarNavigation title={"Statistics"} />
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
    </Box>
  )
}
