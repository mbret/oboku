import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
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

export const MetadataFetchPolicyPane = memo(function MetadataFetchPolicyPane({
  override,
  isProtected,
  resolved,
  onChange,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <List
        dense
        subheader={<ListSubheader>Metadata fetching</ListSubheader>}
        disablePadding
      >
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
      </List>
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
})
