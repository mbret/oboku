import { ReplayOutlined } from "@mui/icons-material"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { Trans, useLingui } from "@lingui/react/macro"
import { reloadPage } from "../../common/browser"
import { ReadingSettings } from "../../settings/ReadingSettings"

export const SettingsList = () => {
  const { t } = useLingui()

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton onClick={reloadPage}>
          <ListItemIcon>
            <ReplayOutlined />
          </ListItemIcon>
          <ListItemText
            primary={t`Reload book`}
            secondary={t`You may try to reload the book if you encounter weird behavior or crash`}
          />
        </ListItemButton>
      </ListItem>
      <ListSubheader sx={{ bgcolor: "transparent" }}>
        <Trans>Reading</Trans>
      </ListSubheader>
      <ReadingSettings />
    </List>
  )
}
