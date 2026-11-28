import { SendRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { useLingui } from "@lingui/react/macro"
import type { SourceType } from "@oboku/shared"
import { useNavigate } from "react-router"
import type { OverlayCloseFn } from "../../navigation/modalHistory"
import { ROUTES } from "../../navigation/routes"
import { useSettings } from "../../settings/useSettings"
import { useSendBookToKindle } from "./useSendBookToKindle"

export function SendBookToKindleListItemButton({
  bookId,
  linkType,
  onClose,
}: {
  bookId: string
  linkType: SourceType | undefined
  onClose: OverlayCloseFn
}) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { data: settings } = useSettings()
  const { mutate: sendBookToKindle } = useSendBookToKindle()
  const isDeviceFile = linkType === "file"
  const hasKindleEmail = !!settings?.kindleEmail

  return (
    <ListItemButton
      disabled={!linkType || isDeviceFile}
      onClick={function sendOrOpenSetup() {
        if (!hasKindleEmail) {
          onClose(function openSendToKindleSetup() {
            navigate(ROUTES.SEND_TO_KINDLE)
          })

          return
        }

        onClose()
        sendBookToKindle({ bookId })
      }}
    >
      <ListItemIcon>
        <SendRounded />
      </ListItemIcon>
      <ListItemText
        primary={t`Send to Kindle`}
        secondary={
          isDeviceFile
            ? t`A book added from this device cannot be sent`
            : undefined
        }
      />
    </ListItemButton>
  )
}
