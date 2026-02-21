import { Button, Menu, MenuItem } from "@mui/material"
import { useState } from "react"
import { localSettingsSignal } from "../settings/useLocalSettings"

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
              themeMode: "light" as const,
            }))
          }}
        >
          Light mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "dark" as const,
            }))
          }}
        >
          Dark mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "e-ink" as const,
            }))
          }}
        >
          E-ink mode
        </MenuItem>
        <MenuItem
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              themeMode: "system" as const,
            }))
          }}
        >
          System mode
        </MenuItem>
      </Menu>
    </>
  )
}
