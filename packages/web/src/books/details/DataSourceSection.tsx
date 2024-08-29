import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack
} from "@mui/material"
import { MoreVertRounded } from "@mui/icons-material"
import { FC, memo, useState } from "react"
import { useDataSourcePlugin } from "../../dataSources/helpers"
import { Report } from "../../debug/report.shared"
import { useBook } from "../states"
import { useCreateRequestPopupDialog } from "../../plugins/useCreateRequestPopupDialog"
import { createDialog } from "../../common/dialogs/createDialog"
import { useUpsertBookLink } from "../useUpdateBookLink"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"
import { useLink } from "../../links/states"

export const DataSourceSection = memo(({ bookId }: { bookId: string }) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const [isSelectItemOpened, setIsSelectItemOpened] = useState(false)
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const refreshMetadata = useRefreshBookMetadata()
  const { mutate: upsertBookLink } = useUpsertBookLink({
    onSuccess: () => [refreshMetadata(bookId)]
  })

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
          <ListItemButton
            key={link?._id}
            sx={{
              px: [null, 3]
            }}
            onClick={() => {
              if (!dataSourcePlugin?.SelectItemComponent) {
                createDialog({ preset: "NOT_IMPLEMENTED", autoStart: true })
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
          </ListItemButton>
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
})
