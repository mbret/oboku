import { List, ListSubheader } from "@mui/material"
import { memo } from "react"
import type { MetadataFetchOverride } from "@oboku/shared"
import { MetadataFetchPolicyListItem } from "./MetadataFetchPolicyListItem"

type Props = {
  override: MetadataFetchOverride
  isProtected: boolean | undefined
  resolved: boolean | undefined
  onChange: (next: MetadataFetchOverride) => void
}

export const MetadataFetchPolicyPane = memo(function MetadataFetchPolicyPane(
  props: Props,
) {
  return (
    <List
      dense
      subheader={<ListSubheader>Metadata fetching</ListSubheader>}
      disablePadding
    >
      <MetadataFetchPolicyListItem {...props} />
    </List>
  )
})
