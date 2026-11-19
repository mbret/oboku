import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type ListItemTextProps,
} from "@mui/material"
import type { ReactNode } from "react"

/** A row that opens `href` in a new tab. */
export function ListItemExternalLink({
  href,
  icon,
  primary,
  secondary,
}: { href: string; icon: ReactNode } & Pick<
  ListItemTextProps,
  "primary" | "secondary"
>) {
  return (
    <ListItem disablePadding>
      <ListItemButton target="_blank" href={href}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItemButton>
    </ListItem>
  )
}
