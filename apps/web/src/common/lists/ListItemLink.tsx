import {
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
  end,
}: {
  to: string
  icon: ReactNode
  disabled?: boolean
  /** Shown after the text, at the row's end. */
  end?: ReactNode
} & Pick<ListItemTextProps, "primary" | "secondary">) {
  return (
    <ListItemButton component={Link} to={to} disabled={disabled}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={primary} secondary={secondary} />
      {end}
    </ListItemButton>
  )
}
