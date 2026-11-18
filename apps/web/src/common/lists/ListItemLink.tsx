import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type ListItemTextProps,
} from "@mui/material"
import type { ReactNode } from "react"
import { Link } from "react-router"

export function ListItemLink({
  to,
  icon,
  primary,
  secondary,
  disabled,
}: { to: string; icon: ReactNode; disabled?: boolean } & Pick<
  ListItemTextProps,
  "primary" | "secondary"
>) {
  return (
    <ListItem disablePadding>
      <ListItemButton component={Link} to={to} disabled={disabled}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItemButton>
    </ListItem>
  )
}
