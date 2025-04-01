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
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            onChange={onClick}
            checked={checked}
            inputProps={{
              "aria-labelledby": id,
            }}
          />
        }
        disablePadding
      >
        <ListItemButton onClick={onClick}>
          <ListItemText id={id} primary={primary} secondary={secondary} />
        </ListItemButton>
      </ListItem>
    )
  },
)
