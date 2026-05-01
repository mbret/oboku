import { Box, ListItem, ListItemText } from "@mui/material"
import type { ReactNode } from "react"

/**
 * Visible glyph for "no value", paired with a screen-reader-friendly
 * label so assistive tech doesn't announce "em dash" (or skip it).
 */
const EmptyValue = () => (
  <Box component="span" aria-label="No value">
    —
  </Box>
)

/**
 * One read-only row in the metadata source detail screen: label on top,
 * value (or em-dash fallback) below. Source content components compose
 * these to express what each metadata source advertises.
 */
export const MetadataFieldRow = ({
  label,
  value,
}: {
  label: ReactNode
  value: ReactNode
}) => (
  <ListItem disableGutters>
    <ListItemText
      primary={label}
      secondary={
        value === undefined || value === null || value === "" ? (
          <EmptyValue />
        ) : (
          value
        )
      }
    />
  </ListItem>
)
