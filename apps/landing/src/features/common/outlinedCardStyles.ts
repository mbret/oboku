import type { CSSObject, Theme } from "@mui/material/styles"

export function outlinedCardStyles(theme: Theme): CSSObject {
  return {
    padding: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  }
}
