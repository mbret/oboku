import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
} from "@mui/material"
import { FileDownloadOutlined } from "@mui/icons-material"
import { memo } from "react"
import type { MetadataFileDownloadOverride } from "@oboku/shared"

type Props = {
  fileDownloadOverride: MetadataFileDownloadOverride
  onFileDownloadChange: (next: MetadataFileDownloadOverride) => void
}

/**
 * Datasource-only pane that controls the default `metadataFileDownloadEnabled`
 * policy applied to NEW books detected during sync.
 *
 * Semantics: only "Disabled" actually overrides — the override is applied at
 * book creation time when the switch is off, otherwise newly-detected books
 * keep the system default. Existing books are never touched.
 */
export const DataSourceMetadataPolicyPane = memo(
  function DataSourceMetadataPolicyPane({
    fileDownloadOverride,
    onFileDownloadChange,
  }: Props) {
    const fileDownloadEnabled = fileDownloadOverride !== false

    return (
      <List
        dense
        subheader={<ListSubheader>Metadata fetching</ListSubheader>}
        disablePadding
      >
        <ListItem
          secondaryAction={
            <Switch
              edge="end"
              checked={fileDownloadEnabled}
              onChange={(_e, checked) =>
                onFileDownloadChange(checked ? null : false)
              }
            />
          }
        >
          <ListItemIcon>
            <FileDownloadOutlined />
          </ListItemIcon>
          <ListItemText
            primary="File download for new books"
            secondary={fileDownloadEnabled ? "Default — Allow" : "Disabled"}
          />
        </ListItem>
      </List>
    )
  },
)
