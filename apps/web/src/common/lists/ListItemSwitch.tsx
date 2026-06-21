import {
  ListItem,
  ListItemButton,
  ListItemText,
  type ListItemTextProps,
  Switch,
} from "@mui/material"
import { memo } from "react"

export const ListItemSwitch = memo(
  ({
    primary,
    secondary,
    onClick,
    checked,
  }: { onClick: () => void; checked: boolean } & Pick<
    ListItemTextProps,
    "primary" | "secondary"
  >) => {
    return (
      <ListItem disablePadding>
        <ListItemButton onClick={onClick} role="switch" aria-checked={checked}>
          <ListItemText primary={primary} secondary={secondary} />
          <Switch
            edge="end"
            checked={checked}
            tabIndex={-1}
            disableRipple
            aria-hidden
            slotProps={{ input: { tabIndex: -1 } }}
          />
        </ListItemButton>
      </ListItem>
    )
  },
)
