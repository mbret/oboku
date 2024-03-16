import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack
} from "@mui/material"
import { MoreVertRounded } from "@mui/icons-material"
import { FC, useState } from "react"
import { useDataSourcePlugin } from "../../dataSources/helpers"
import { Report } from "../../debug/report.shared"
import { useBookLinksState } from "../states"
import { useCreateRequestPopupDialog } from "../../plugins/useCreateRequestPopupDialog"
import { upsertBookLink } from "../triggers"
import { useTagsByIds } from "../../tags/helpers"
import { createDialog } from "../../common/dialogs/createDialog"

export const DataSourceSection: FC<{ bookId: string }> = ({ bookId }) => {
  const link = useBookLinksState({ bookId, tags: useTagsByIds().data })[0]
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const [isSelectItemOpened, setIsSelectItemOpened] = useState(false)
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  return (
    <>
      <List
        disablePadding
        dense
        subheader={
          <ListSubheader
            sx={{
              px: [null, 3]
            }}
          >
            Link
          </ListSubheader>
        }
      >
        {!!link && !!dataSourcePlugin && (
          <ListItem
            key={link?._id}
            button
            sx={{
              px: [null, 3]
            }}
            onClick={() => {
              if (!dataSourcePlugin?.SelectItemComponent) {
                createDialog({ preset: "NOT_IMPLEMENTED" })
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
            <Stack width={50} alignItems="center" flexShrink={0}>
              <MoreVertRounded />
            </Stack>
          </ListItem>
        )}
      </List>
      {dataSourcePlugin?.SelectItemComponent && (
        <dataSourcePlugin.SelectItemComponent
          open={isSelectItemOpened}
          requestPopup={createRequestPopupDialog({
            name: dataSourcePlugin.name
          })}
          onClose={(error, item) => {
            setIsSelectItemOpened(false)
            if (error) {
              Report.error(error)
            } else {
              if (item) {
                upsertBookLink({
                  bookId,
                  linkResourceId: item.resourceId,
                  linkType: dataSourcePlugin.type
                })
              }
            }
          }}
        />
      )}
    </>
  )
}
