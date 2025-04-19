import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
} from "@mui/material"
import { MoreVertRounded } from "@mui/icons-material"
import { memo, useState } from "react"
import { useDataSourcePlugin } from "../../dataSources/helpers"
import { Logger } from "../../debug/logger.shared"
import { useBook } from "../states"
import { useCreateRequestPopupDialog } from "../../plugins/useCreateRequestPopupDialog"
import { createDialog } from "../../common/dialogs/createDialog"
import { useUpsertBookLink } from "../useUpdateBookLink"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"
import { useLink } from "../../links/states"
import { useLinkInfo } from "../../plugins/useLinkInfo"

export const DataSourceSection = memo(({ bookId }: { bookId: string }) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const { data: linkInfo } = useLinkInfo(bookId)
  const dataSourcePlugin = useDataSourcePlugin(link?.type)
  const [isSelectItemOpened, setIsSelectItemOpened] = useState(false)
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const refreshMetadata = useRefreshBookMetadata()
  const { mutate: upsertBookLink } = useUpsertBookLink({
    onSuccess: () => [refreshMetadata(bookId)],
  })

  return (
    <>
      <List
        disablePadding
        dense
        subheader={
          <ListSubheader
            sx={{
              px: [null, 3],
            }}
          >
            Source
          </ListSubheader>
        }
      >
        {!!link && !!dataSourcePlugin && (
          <ListItemButton
            key={link?._id}
            sx={{
              px: [null, 3],
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
                  textOverflow: "ellipsis",
                },
              }}
              secondary={linkInfo.label}
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
            name: dataSourcePlugin.name,
          })}
          onClose={(error, item) => {
            setIsSelectItemOpened(false)

            if (error) {
              Logger.error(error)
            } else {
              if (item) {
                upsertBookLink({
                  bookId,
                  linkResourceId: item.resourceId,
                  linkType: dataSourcePlugin.type,
                })
              }
            }
          }}
        />
      )}
    </>
  )
})
