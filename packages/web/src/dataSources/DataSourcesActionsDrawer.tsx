import {
  Drawer,
  ListItem,
  List,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material"
import { FC, memo } from "react"
import {
  SyncRounded,
  DeleteForeverRounded,
  RadioButtonUncheckedOutlined,
  CheckCircleRounded
} from "@mui/icons-material"
import { useSynchronizeDataSource } from "./helpers"
import { useDataSource } from "./useDataSource"
import { toggleDatasourceProtected } from "./triggers"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"
import { useRemoveDataSource } from "./useRemoveDataSource"

export const DataSourcesActionsDrawer: FC<{
  openWith: string
  onClose: () => void
}> = memo(({ openWith, onClose }) => {
  const syncDataSource = useSynchronizeDataSource()
  const { mutate: removeDataSource } = useRemoveDataSource()
  const { data: dataSource } = useDataSource(openWith)
  const library = useSignalValue(libraryStateSignal)

  return (
    <>
      <Drawer anchor="bottom" open={true} onClose={onClose}>
        <List>
          <ListItem
            button
            onClick={() => {
              syncDataSource(openWith)
              onClose()
            }}
          >
            <ListItemIcon>
              <SyncRounded />
            </ListItemIcon>
            <ListItemText primary="Synchronize" />
          </ListItem>
        </List>
        <ListItem
          button
          onClick={() => {
            toggleDatasourceProtected(openWith)

            const datasourceWillBeHidden =
              !dataSource?.isProtected && !library.isLibraryUnlocked

            if (datasourceWillBeHidden) {
              onClose()
            }
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
        </ListItem>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              onClose()
              removeDataSource({ id: openWith })
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove the data source" />
          </ListItem>
        </List>
      </Drawer>
    </>
  )
})
