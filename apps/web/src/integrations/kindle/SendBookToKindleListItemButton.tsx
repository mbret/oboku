import { SendRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { useLingui } from "@lingui/react/macro"
import type { SourceType } from "@oboku/shared"
import { useNavigate } from "react-router"
import { ROUTES } from "../../navigation/routes"
import { useSettings } from "../../settings/useSettings"
import { useSendBookToKindle } from "./useSendBookToKindle"

/**
 * The "Send to Kindle" row of a book's actions. It opens the setup screen
 * while the user has no Send to Kindle address.
 *
 * @param onClose closes the list the row is in, then runs the callback it is
 * given.
 */
export function SendBookToKindleListItemButton({
  bookId,
  linkType,
  onClose,
}: {
  bookId: string
  /** The source of the book's file, none while the book has no file. */
  linkType: SourceType | undefined
  onClose: (afterClose?: () => void) => void
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
