import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from "@mui/material"
import { MoreVertRounded } from "@mui/icons-material"
import { FC, useState } from "react"
import { useRecoilValue } from "recoil"
import { useAction } from "../../actions"
import { useDataSourcePlugin } from "../../dataSources/helpers"
import { DebugInfo } from "../../debug/DebugInfo"
import { Report } from "../../debug/report.shared"
import { useDialogManager } from "../../dialog"
import { useRefreshBookMetadata } from "../helpers"
import { bookLinksState } from "../states"

export const DataSourceSection: FC<{ bookId: string }> = ({ bookId }) => {
  const link = useRecoilValue(bookLinksState(bookId))[0]
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const [isSelectItemOpened, setIsSelectItemOpened] = useState(false)
  const dialog = useDialogManager()
  const { execute } = useAction()
  const refreshBookMetadata = useRefreshBookMetadata()

  return (
    <>
      <List subheader={<ListSubheader>Data source</ListSubheader>}>
        {!!link && !!dataSourcePlugin && (
          <ListItem
            key={link?._id}
            button
            onClick={() => {
              if (!dataSourcePlugin?.SelectItemComponent) {
                dialog({ preset: "NOT_IMPLEMENTED" })
              } else {
                setIsSelectItemOpened(true)
              }
            }}
          >
            <ListItemIcon>
              {dataSourcePlugin.Icon && <dataSourcePlugin.Icon />}
            </ListItemIcon>
            <ListItemText
              primary={`${dataSourcePlugin?.name}`}
              primaryTypographyProps={{
                style: {
                  paddingRight: 10,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }
              }}
              secondary={`This book has been created from ${dataSourcePlugin.name}. Click to edit the data source`}
            />
            <MoreVertRounded />
          </ListItem>
        )}
        <DebugInfo info={{ id: link?._id || `` }} mb={2} />
        {process.env.NODE_ENV === "development" && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => {
              refreshBookMetadata(bookId)
            }}
          >
            debug:refresh_metadata
          </Button>
        )}
      </List>
      {dataSourcePlugin?.SelectItemComponent && (
        <dataSourcePlugin.SelectItemComponent
          open={isSelectItemOpened}
          onClose={async (error, item) => {
            if (error) {
              Report.error(error)
            } else {
              setIsSelectItemOpened(false)
              if (item) {
                execute({
                  type: `UPSERT_BOOK_LINK`,
                  data: {
                    bookId,
                    linkResourceId: item.resourceId,
                    linkType: dataSourcePlugin.type
                  }
                })
              }
            }
          }}
        />
      )}
    </>
  )
}
