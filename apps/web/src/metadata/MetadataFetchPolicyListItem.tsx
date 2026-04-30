import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { CloudDownloadOutlined } from "@mui/icons-material"
import { memo, useState } from "react"
import type { MetadataFetchOverride } from "@oboku/shared"
import { MetadataFetchPolicyDialog } from "./MetadataFetchPolicyDialog"
import { formatMetadataFetchSecondary } from "./useResolvedMetadataFetchEnabled"

type Props = {
  override: MetadataFetchOverride
  isProtected: boolean | undefined
  resolved: boolean | undefined
  onChange: (next: MetadataFetchOverride) => void
}

/**
 * Single list row + dialog controlling the "fetch external metadata
 * providers" policy. Designed to be composed inside any `<List>` so callers
 * can group it with sibling rows (e.g. the book-only file download toggle).
 */
export const MetadataFetchPolicyListItem = memo(
  function MetadataFetchPolicyListItem({
    override,
    isProtected,
    resolved,
    onChange,
  }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
      <>
        <ListItemButton onClick={() => setDialogOpen(true)}>
          <ListItemIcon>
            <CloudDownloadOutlined />
          </ListItemIcon>
          <ListItemText
            primary="External providers"
            secondary={formatMetadataFetchSecondary({
              override,
              isProtected,
              resolved,
            })}
          />
        </ListItemButton>
        <MetadataFetchPolicyDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          override={override}
          isProtected={isProtected}
          resolved={resolved}
          onChange={onChange}
        />
      </>
    )
  },
)
