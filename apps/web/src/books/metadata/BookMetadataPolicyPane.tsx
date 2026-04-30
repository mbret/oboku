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
import type {
  MetadataFetchOverride,
  MetadataFileDownloadOverride,
} from "@oboku/shared"
import { MetadataFetchPolicyListItem } from "../../metadata/MetadataFetchPolicyListItem"

type Props = {
  override: MetadataFetchOverride
  isProtected: boolean | undefined
  resolved: boolean | undefined
  onChange: (next: MetadataFetchOverride) => void
  fileDownloadOverride: MetadataFileDownloadOverride
  onFileDownloadChange: (next: MetadataFileDownloadOverride) => void
}

/**
 * Book-only pane grouping every metadata-fetch policy under a single
 * "Metadata fetching" subheader: the shared external-providers control
 * plus the book-only "file download during metadata refresh" toggle.
 *
 * Collections use the leaner {@link MetadataFetchPolicyPane} since they
 * never trigger a file download.
 */
export const BookMetadataPolicyPane = memo(function BookMetadataPolicyPane({
  override,
  isProtected,
  resolved,
  onChange,
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
      <MetadataFetchPolicyListItem
        override={override}
        isProtected={isProtected}
        resolved={resolved}
        onChange={onChange}
      />
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            checked={fileDownloadEnabled}
            onChange={(_e, checked) =>
              onFileDownloadChange(checked ? null : false)
            }
            inputProps={{
              "aria-label": "Allow file download during metadata refresh",
            }}
          />
        }
      >
        <ListItemIcon>
          <FileDownloadOutlined />
        </ListItemIcon>
        <ListItemText
          primary="File download"
          secondary={
            fileDownloadEnabled
              ? "Allowed — the file may be downloaded to extract a cover and embedded metadata."
              : "Disabled — the file is never downloaded during a metadata refresh."
          }
        />
      </ListItem>
    </List>
  )
})
