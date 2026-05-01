import { List, ListSubheader } from "@mui/material"
import type { FileMetadata } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { MetadataFieldRow } from "./MetadataFieldRow"
import { BOOK_METADATA_FIELD_LABELS as L } from "./fieldLabels"
import { formatBookMetadataDate, formatList } from "./formatters"

type Props = {
  metadata: DeepReadonlyObject<FileMetadata> | undefined
}

/**
 * Read-only content extracted from the file itself (EPUB OPF or RAR/ZIP
 * scan). The advertised fields mirror what `parseOpfMetadata` and the
 * archive scanners can produce.
 */
export const FileSourceContent = ({ metadata }: Props) => (
  <List dense subheader={<ListSubheader disableGutters>Fields</ListSubheader>}>
    <MetadataFieldRow label={L.title} value={metadata?.title?.toString()} />
    <MetadataFieldRow label={L.authors} value={formatList(metadata?.authors)} />
    <MetadataFieldRow label={L.publisher} value={metadata?.publisher} />
    <MetadataFieldRow label={L.rights} value={metadata?.rights} />
    <MetadataFieldRow
      label={L.languages}
      value={formatList(metadata?.languages)}
    />
    <MetadataFieldRow
      label={L.date}
      value={formatBookMetadataDate(metadata?.date)}
    />
    <MetadataFieldRow
      label={L.subjects}
      value={formatList(metadata?.subjects)}
    />
    <MetadataFieldRow label={L.coverLink} value={metadata?.coverLink} />
    <MetadataFieldRow
      label={L.pageCount}
      value={
        metadata?.pageCount !== undefined ? `${metadata.pageCount}` : undefined
      }
    />
    <MetadataFieldRow label={L.contentType} value={metadata?.contentType} />
  </List>
)
