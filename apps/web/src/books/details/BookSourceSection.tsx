import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  styled,
} from "@mui/material"
import { MoreVertRounded } from "@mui/icons-material"
import { memo, useState } from "react"
import { useSourcePlugin } from "../../integrations/plugins/useSourcePlugin"
import { PluginSelectItem } from "../../integrations/plugins/PluginSelectItem"
import { Logger } from "../../debug/logger.shared"
import { useBook } from "../states"
import { useCreateRequestPopupDialog } from "../../integrations/plugins/useCreateRequestPopupDialog"
import { showDialog } from "../../common/dialogs/createDialog"
import { createNotImplementedDialogOptions } from "../../common/dialogs/presets"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"
import { useLink } from "../../links/states"
import { useLinkInfo } from "../../integrations/plugins/useLinkInfo"
import { useUpsertLink } from "../../links/useUpsertLink"

const TrailingIconStack = styled(Stack)({
  width: 50,
  alignItems: "center",
  flexShrink: 0,
})

export const BookSourceSection = memo(function BookSourceSection({
  bookId,
}: {
  bookId: string
}) {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const { data: linkInfo } = useLinkInfo(bookId)
  const sourcePlugin = useSourcePlugin(link?.type)
  const [isSelectItemOpened, setIsSelectItemOpened] = useState(false)
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const refreshMetadata = useRefreshBookMetadata()
  const { mutate: upsertBookLink } = useUpsertLink({
    onSuccess: function refreshMetadataFromPickedFile() {
      refreshMetadata(bookId)
    },
  })

  return (
    <>
      <List
        disablePadding
        dense
        subheader={<ListSubheader>Source</ListSubheader>}
      >
        {!!link && !!sourcePlugin && (
          <ListItemButton
            key={link?._id}
            onClick={() => {
              if (!sourcePlugin?.SelectItemComponent) {
                showDialog(createNotImplementedDialogOptions())
              } else {
                setIsSelectItemOpened(true)
              }
            }}
          >
            <ListItemIcon>
              <sourcePlugin.Icon />
            </ListItemIcon>
            <ListItemText
              primary={`${sourcePlugin?.name}`}
              secondary={linkInfo?.label}
              slotProps={{
                primary: {
                  style: {
                    paddingRight: 10,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                },
              }}
            />
            <TrailingIconStack>
              <MoreVertRounded />
            </TrailingIconStack>
          </ListItemButton>
        )}
      </List>
      {sourcePlugin && !!link && (
        <PluginSelectItem
          link={link}
          open={isSelectItemOpened}
          requestPopup={createRequestPopupDialog({
            name: sourcePlugin.name,
          })}
          onClose={(error, item) => {
            setIsSelectItemOpened(false)

            if (error) {
              Logger.error(error)
            } else {
              if (item) {
                upsertBookLink({
                  bookId,
                  data: item.data,
                  type: sourcePlugin.type,
                })
              }
            }
          }}
        />
      )}
    </>
  )
})
