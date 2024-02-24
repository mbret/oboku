import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Box, List, ListItem, ListItemText, ListSubheader } from "@mui/material"
import { useBookIdsState } from "../books/states"
import { useCollectionsAsArrayState } from "../collections/states"

export const StatisticsScreen = () => {
  const bookIds = useBookIdsState()
  const collectionsAsArray = useCollectionsAsArrayState()

  return (
    <>
      <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
        <TopBarNavigation title={"Statistics"} />
        <List>
          <ListSubheader disableSticky>Books</ListSubheader>
          <ListItem>
            <ListItemText primary="Total of books" secondary={bookIds.length} />
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
    </>
  )
}
