import {
  Dialog,
  DialogTitle,
  ListItemText,
  List,
  ListItemIcon,
  ListItemButton,
  DialogContent,
  Typography,
  styled,
} from "@mui/material"
import { RadioButtonUnchecked, RadioButtonChecked } from "@mui/icons-material"
import { memo } from "react"
import type { MetadataFetchOverride } from "@oboku/shared"
import { formatMetadataFetchDefaultDescription } from "./useResolvedMetadataFetchEnabled"

const HeaderDialogContent = styled(DialogContent)({
  paddingBottom: 0,
})

type PolicyValue = "default" | "always" | "never"

const overrideToValue = (override: MetadataFetchOverride): PolicyValue => {
  if (override === true) return "always"
  if (override === false) return "never"
  return "default"
}

const valueToOverride = (value: PolicyValue): MetadataFetchOverride => {
  if (value === "always") return true
  if (value === "never") return false
  return null
}

type Props = {
  open: boolean
  onClose: () => void
  override: MetadataFetchOverride
  isProtected: boolean | undefined
  resolved: boolean | undefined
  onChange: (override: MetadataFetchOverride) => void
}

export const MetadataFetchPolicyDialog = memo(
  function MetadataFetchPolicyDialog({
    open,
    onClose,
    override,
    isProtected,
    resolved,
    onChange,
  }: Props) {
    const current = overrideToValue(override)

    const handleSelect = (next: PolicyValue) => {
      onClose()
      if (next === current) return
      onChange(valueToOverride(next))
    }

    return (
      <Dialog onClose={onClose} open={open} fullWidth>
        <DialogTitle>Metadata fetching</DialogTitle>
        <HeaderDialogContent>
          <Typography variant="body2" color="text.secondary">
            Whether to fetch metadata from external providers (Google Books,
            ComicVine, etc.).
          </Typography>
        </HeaderDialogContent>
        <List>
          <ListItemButton onClick={() => handleSelect("default")}>
            <ListItemIcon>
              {current === "default" ? (
                <RadioButtonChecked />
              ) : (
                <RadioButtonUnchecked />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Default"
              secondary={formatMetadataFetchDefaultDescription({
                isProtected,
                resolved,
              })}
            />
          </ListItemButton>
          <ListItemButton onClick={() => handleSelect("always")}>
            <ListItemIcon>
              {current === "always" ? (
                <RadioButtonChecked />
              ) : (
                <RadioButtonUnchecked />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Always"
              secondary="Fetch external metadata even when this item is protected."
            />
          </ListItemButton>
          <ListItemButton onClick={() => handleSelect("never")}>
            <ListItemIcon>
              {current === "never" ? (
                <RadioButtonChecked />
              ) : (
                <RadioButtonUnchecked />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Never"
              secondary="Skip external metadata for this item."
            />
          </ListItemButton>
        </List>
      </Dialog>
    )
  },
)
