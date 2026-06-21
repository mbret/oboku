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
    id,
  }: { onClick: () => void; checked: boolean; id: string } & Pick<
    ListItemTextProps,
    "primary" | "secondary"
  >) => {
    return (
      <ListItem disablePadding>
        <ListItemButton onClick={onClick}>
          <ListItemText id={id} primary={primary} secondary={secondary} />
          <Switch
            edge="end"
            checked={checked}
            tabIndex={-1}
            disableRipple
            slotProps={{
              input: {
                "aria-labelledby": id,
              },
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  },
)
