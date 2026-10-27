import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
} from "@mui/material"
import { memo } from "react"
import {
  SyncRounded,
  DeleteForeverRounded,
  InfoOutlineRounded,
} from "@mui/icons-material"
import { useDataSource } from "./useDataSource"
import { useSignalValue } from "reactjrx"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../library/books/states"
import { useRemoveDataSource } from "./useRemoveDataSource"
import { useDataSourceIncrementalModify } from "./useDataSourceIncrementalModify"
import { useSynchronizeDataSource } from "./useSynchronizeDataSource"
import { generatePath, Link } from "react-router"
import { ROUTES } from "../navigation/routes"
import { Checkbox } from "../common/Checkbox"

export const DataSourceActionsDrawer = memo(
  ({ openWith, onClose }: { openWith?: string; onClose: () => void }) => {
    const { mutate: syncDataSource } = useSynchronizeDataSource()
    const { mutate: removeDataSource } = useRemoveDataSource()
    const { data: dataSource } = useDataSource(openWith)
    const isLibraryUnlocked = useSignalValue(
      libraryStateSignal,
      selectIsLibraryUnlocked,
    )
    const { mutate: modifyDataSource } = useDataSourceIncrementalModify()

    return (
      <Drawer anchor="bottom" open={!!openWith} onClose={onClose}>
        {!openWith ? null : (
          <List>
            <ListItemButton
              component={Link}
              to={generatePath(ROUTES.DATASOURCE_DETAILS, { id: openWith })}
              onClick={() => {
                onClose()
              }}
            >
              <ListItemIcon>
                <InfoOutlineRounded />
              </ListItemIcon>
              <ListItemText primary="Go to details" />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                syncDataSource(openWith)
                onClose()
              }}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText primary="Synchronize" />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                const datasourceWillBeHidden =
                  !dataSource?.isProtected && !isLibraryUnlocked

                if (datasourceWillBeHidden) {
                  onClose()
                }

                modifyDataSource({
                  id: openWith,
                  mutationFunction: (old) => ({
                    ...old,
                    isProtected: !old.isProtected,
                  }),
                })
              }}
            >
              <ListItemIcon>
                <Checkbox selected={!!dataSource?.isProtected} />
              </ListItemIcon>
              <ListItemText
                primary="Mark as protected"
                secondary="This will lock and hide books behind it. Use unlock features to display them"
              />
            </ListItemButton>
            <Divider />
            <ListItemButton
              onClick={() => {
                onClose()
                removeDataSource({ id: openWith })
              }}
            >
              <ListItemIcon>
                <DeleteForeverRounded />
              </ListItemIcon>
              <ListItemText primary="Remove the data source" />
            </ListItemButton>
          </List>
        )}
      </Drawer>
    )
  },
)
