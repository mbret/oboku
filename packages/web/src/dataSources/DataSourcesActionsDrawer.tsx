import {
  Drawer,
  ListItem,
  List,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material"
import React, { FC } from "react"
import {
  SyncRounded,
  DeleteForeverRounded,
  RadioButtonUncheckedOutlined,
  CheckCircleRounded
} from "@mui/icons-material"
import { useSynchronizeDataSource, useRemoveDataSource } from "./helpers"
import { useDataSource } from "./useDataSource"
import { useAction } from "../actions"

export const DataSourcesActionsDrawer: FC<{
  openWith: string
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const syncDataSource = useSynchronizeDataSource()
  // const renewAuthorization = useRenewDataSourceCredentials()
  const [remove] = useRemoveDataSource()
  const { execute } = useAction()
  const dataSource = useDataSource(openWith)

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
          {/* <ListItem button onClick={() => {
            renewAuthorization(openWith)
            onClose()
          }}>
            <ListItemIcon><VpnKeyRounded /></ListItemIcon>
            <ListItemText primary="Renew authorization" />
          </ListItem> */}
        </List>
        <ListItem
          button
          onClick={() =>
            execute({
              type: `TOGGLE_DATASOURCE_PROTECTED`,
              data: { id: openWith }
            })
          }
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
              remove({ id: openWith })
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
}
