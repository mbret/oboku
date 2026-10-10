import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Box, ListItem, ListItemText } from "@mui/material"
import { useCollections } from "../collections/useCollections"
import { useBooks } from "../books/states"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"

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
        <PageSection title="Books">
          <ListItem>
            <ListItemText primary="Total of books" secondary={books?.length} />
          </ListItem>
        </PageSection>
        <PageSection title="Collections">
          <ListItem>
            <ListItemText
              primary="Total of collections"
              secondary={collectionsAsArray.length}
            />
          </ListItem>
        </PageSection>
      </PageContainer>
    </Box>
  )
}
