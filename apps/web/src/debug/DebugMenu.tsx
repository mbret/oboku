import { Button, Menu, MenuItem } from "@mui/material"
import { useState } from "react"
import { localSettingsSignal } from "../settings/states"

export const DebugMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        style={{
          position: "fixed",
          bottom: 62,
          right: 4,
          zIndex: 1000,
          borderRadius: 8,
        }}
        size="small"
        onClick={handleClick}
      >
        DebugMenu
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "light",
            }))
          }}
        >
          Light mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "dark",
            }))
          }}
        >
          Dark mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "e-ink",
            }))
          }}
        >
          E-ink mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "system",
            }))
          }}
        >
          System mode
        </MenuItem>
      </Menu>
    </>
  )
}
