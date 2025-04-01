import type { FC } from "react"
import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  capitalize,
} from "@mui/material"
import { plugins as dataSourcePlugins } from "../dataSources"
import { useLocalSettings } from "../settings/states"

export const UploadBookDrawer: FC<{
  open: boolean
  onClose: (type?: string | undefined) => void
}> = ({ open, onClose }) => {
  const { showSensitiveDataSources } = useLocalSettings()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
        transitionDuration={0}
      >
        <div role="presentation">
          <List>
            {dataSourcePlugins
              .filter(
                ({ UploadBookComponent, sensitive }) =>
                  !!UploadBookComponent &&
                  (showSensitiveDataSources ? true : sensitive !== true),
              )
              .map((dataSource) => (
                <ListItemButton
                  onClick={() => onClose(dataSource.type)}
                  key={dataSource.type}
                >
                  <ListItemIcon>
                    {dataSource.Icon && <dataSource.Icon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`From ${capitalize(dataSource.name)}`}
                  />
                </ListItemButton>
              ))}
          </List>
        </div>
      </Drawer>
    </>
  )
}
