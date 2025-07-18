import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
} from "@mui/material"
import { type FC, memo } from "react"
import {
  SyncRounded,
  DeleteForeverRounded,
  RadioButtonUncheckedOutlined,
  CheckCircleRounded,
  InfoOutlineRounded,
} from "@mui/icons-material"
import { useDataSource } from "./useDataSource"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/books/states"
import { useRemoveDataSource } from "./useRemoveDataSource"
import { useDataSourceIncrementalModify } from "./useDataSourceIncrementalModify"
import { useSynchronizeDataSource } from "./useSynchronizeDataSource"
import { Link } from "react-router"
import { ROUTES } from "../navigation/routes"

export const DataSourcesActionsDrawer: FC<{
  openWith: string
  onClose: () => void
}> = memo(({ openWith, onClose }) => {
  const { mutate: syncDataSource } = useSynchronizeDataSource()
  const { mutate: removeDataSource } = useRemoveDataSource()
  const { data: dataSource } = useDataSource(openWith)
  const library = useSignalValue(libraryStateSignal)
  const { mutate: modifyDataSource } = useDataSourceIncrementalModify()

  return (
    <Drawer anchor="bottom" open={true} onClose={onClose}>
      <List>
        <ListItemButton
          component={Link}
          to={ROUTES.DATASOURCE_DETAILS.replace(":id", openWith)}
          onClick={() => {
            onClose()
          }}
        >
          <ListItemIcon>
            <InfoOutlineRounded />
          </ListItemIcon>
          <ListItemText primary="Details" />
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
              !dataSource?.isProtected && !library.isLibraryUnlocked

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
            {!dataSource?.isProtected && <RadioButtonUncheckedOutlined />}
            {dataSource?.isProtected && <CheckCircleRounded />}
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
    </Drawer>
  )
})
