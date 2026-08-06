import { DownloadOutlined, MoreVertOutlined } from "@mui/icons-material"
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material"
import { type MouseEvent, useState } from "react"
import { useExportBookFileToDevice } from "../../../download/useExportBookFileToDevice"
import { useIsApplyingLocally } from "../apply/useApplyLocally"

type Props = {
  bookId: string
}

export function BookOptimizeActionsMenu({ bookId }: Props) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const isApplyingLocally = useIsApplyingLocally(bookId)
  const { exportBookFileToDevice, isExportingToDevice } =
    useExportBookFileToDevice(bookId)

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
          disabled={isApplyingLocally || isExportingToDevice}
          onClick={function downloadLocalFileToDevice() {
            closeMenu()
            exportBookFileToDevice()
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
