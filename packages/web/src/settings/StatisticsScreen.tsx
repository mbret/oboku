import { TopBarNavigation } from '../navigation/TopBarNavigation';
import { Box, List, ListItem, ListItemText, ListSubheader } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { bookIdsState } from '../books/states';
import { collectionsAsArrayState } from '../collections/states';

export const StatisticsScreen = () => {
  const bookIds = useRecoilValue(bookIdsState)
  const collectionsAsArray = useRecoilValue(collectionsAsArrayState)

  return (
    <>
      <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
        <TopBarNavigation title={'Statistics'} />
        <List >
          <ListSubheader disableSticky>Books</ListSubheader>
          <ListItem>
            <ListItemText
              primary="Total of books"
              secondary={bookIds.length}
            />
          </ListItem>
          <ListSubheader disableSticky>Collections</ListSubheader>
          <ListItem>
            <ListItemText
              primary="Total of collections"
              secondary={collectionsAsArray.length}
            />
          </ListItem>
        </List>
      </Box >
    </>
  );
}