import { DownloadOutlined, MoreVertOutlined } from "@mui/icons-material"
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material"
import { type MouseEvent, useState } from "react"
import { useIsApplyingLocally } from "../apply/useApplyLocally"
import { useDownloadBookFileToDevice } from "./useDownloadBookFileToDevice"

type Props = {
  bookId: string
}

export function BookOptimizeActionsMenu({ bookId }: Props) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const isApplyingLocally = useIsApplyingLocally(bookId)
  const { downloadBookFileToDevice, isDownloadingToDevice } =
    useDownloadBookFileToDevice(bookId)

  function closeMenu() {
    setAnchorElement(null)
  }

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="More actions"
        onClick={function openMenu(event: MouseEvent<HTMLButtonElement>) {
          setAnchorElement(event.currentTarget)
        }}
      >
        <MoreVertOutlined />
      </IconButton>
      <Menu anchorEl={anchorElement} open={!!anchorElement} onClose={closeMenu}>
        <MenuItem
          disabled={isApplyingLocally || isDownloadingToDevice}
          onClick={function downloadLocalFileToDevice() {
            closeMenu()
            downloadBookFileToDevice()
          }}
        >
          <ListItemIcon>
            <DownloadOutlined />
          </ListItemIcon>
          <ListItemText primary="Download to device" />
        </MenuItem>
      </Menu>
    </>
  )
}
