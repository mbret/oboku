import { Button, List, ListItem, ListItemIcon, ListItemText, ListSubheader } from "@material-ui/core"
import { MoreVertRounded } from "@material-ui/icons"
import { FC } from "react"
import { useRecoilValue } from "recoil"
import { useDataSourcePlugin } from "../../dataSources/helpers"
import { useDialogManager } from "../../dialog"
import { useRefreshBookMetadata } from "../helpers"
import { bookLinksState } from "../states"

export const DataSourceSection: FC<{ bookId: string }> = ({ bookId }) => {
  const refreshBookMetadata = useRefreshBookMetadata()
  const link = useRecoilValue(bookLinksState(bookId))[0]
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const dialog = useDialogManager()

  return (
    <List subheader={<ListSubheader>Data source</ListSubheader>}>
      {!!link && !!dataSourcePlugin && (
        <ListItem
          key={link?._id}
          button
          onClick={() => dialog({ preset: 'NOT_IMPLEMENTED' })}
        >
          <ListItemIcon>
            <dataSourcePlugin.Icon />
          </ListItemIcon>
          <ListItemText
            primary={`${dataSourcePlugin?.name}`}
            primaryTypographyProps={{
              style: {
                paddingRight: 10,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            }}
            secondary={`This book has been created from ${dataSourcePlugin.name}. Click to edit the data source`}
          />
          <MoreVertRounded />
        </ListItem>
      )}
      {process.env.NODE_ENV === 'development' && (
        <Button fullWidth variant="outlined" color="primary" onClick={() => { refreshBookMetadata(bookId) }}>debug:refresh_metadata</Button>
      )}
    </List>
  )
}